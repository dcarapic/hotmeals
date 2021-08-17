using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace hotmeals_server.Services
{

    /// <summary>
    /// Custom logger provider which writes information to the log in a separate thread (async).
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class AsyncLoggerProvider : ILoggerProvider
    {
        // Log write queue
        private BlockingCollection<(ConsoleColor color, string message)> _logQueue = new BlockingCollection<(ConsoleColor color, string message)>(10000);
        // Thread which perfoms the actual writing
        private Thread _logThread;
        // Used when disposing to shutdown the log thread
        private CancellationTokenSource _logThreadCancelSource = new CancellationTokenSource();
        private volatile int _disposed;
        // If logging is failing then do not log any more!
        private volatile int _failed;

        // Statistic information
        private long _logCounter = 0;
        // Where the logs are stored
        private string _logFolder;

        // Current log file name
        private string _currentLogFileName;

        // Log file name prefix
        private string _fileNamePrefix;

        // Writing to file
        private FileStream _stream;
        private StreamWriter _writer;

        // Should write to console
        private bool _writeToConsole;

        /// <summary>
        /// Default setting for AutoArchiveLog used on creation of AsyncFileLogger
        /// </summary>
        public static bool DefaultAutoArchiveLog { get; set; }

        /// <summary>
        /// Default setting for RemoveOldLogs used on creation of AsyncFileLogger
        /// </summary>
        public static bool DefaultRemoveOldLogs { get; set; }

        /// <summary>
        /// Default setting for RemoveOldLogsDays used on creation of AsyncFileLogger
        /// </summary>
        public static int DefaultRemoveOldLogsDays { get; set; }

        /// <summary>
        /// Pending log queue size.
        /// </summary>
        /// <returns></returns>
        public int PendingLogQueueSize
        {
            get { return _logQueue.Count; }
        }

        /// <summary>
        /// If true then after a log file has been closed it will automatically be compressed into an archive (.zip)
        /// </summary>
        public bool AutoArchiveLog { get; set; }

        /// <summary>
        /// If true then after a log file has been closed any old log files will be deleted (which are more then RemoveOldLogsDays days in the past).
        /// </summary>
        public bool RemoveOldLogs { get; set; }

        /// <summary>
        /// How many days in the past should we remove old logs.
        /// </summary>
        public int RemoveOldLogsDays { get; set; }


        public IHttpContextAccessor HttpContext { get; private set; }

        /// <summary>
        /// Current log file name.
        /// </summary>
        /// <returns></returns>
        public string CurrentLogFile
        {
            get { return Path.Combine(_logFolder, _currentLogFileName + ".log"); }
        }

        /// <summary>
        /// True if disposed.
        /// </summary>
        /// <returns></returns>
        public bool IsDisposed
        {
            get { return _disposed == 1; }
        }


        /// <summary>
        /// Occurs when new log file is created.
        /// </summary>
        public event EventHandler NewLogFileCreated;


        /// <summary>
        /// Initializes a new instance of the <see cref="AsyncLoggerProvider" /> class.
        /// </summary>
        /// <param name="logFolder">The log folder. If null then subfolder 'Logs' will be used.</param>
        /// <param name="fileNamePrefix">The file name prefix. Each log file will be prefixed with the given prefix. If null then main application assembly name is used.</param>
        /// <param name="writeToConsole">Determines which log types should be written to the console.</param>
        public AsyncLoggerProvider(string logFolder, string fileNamePrefix, bool writeToConsole, IHttpContextAccessor httpContextAccessor)
        {
            _writeToConsole = writeToConsole;
            _logFolder = logFolder == null ? "Logs" : logFolder;
            _fileNamePrefix = fileNamePrefix == null ? System.Reflection.Assembly.GetEntryAssembly().GetName().Name + "_" : fileNamePrefix;
            HttpContext = httpContextAccessor;

            // Create folder if it does not exist
            if (!Directory.Exists(_logFolder))
            {
                Directory.CreateDirectory(_logFolder);
            }
            _currentLogFileName = _fileNamePrefix + DateTime.Today.ToString("yyyy-MM-dd");

            _logThread = new Thread(new ThreadStart(LogMethod));
            _logThread.IsBackground = true;
            _logThread.Start();
            _logThread.Name = "AsyncLoggerProvider";

        }

        public ILogger CreateLogger(string categoryName)
        {
            return new Logger(this, categoryName);
        }



        /// <summary>
        /// Performs the actual message writting. Override in child class.
        /// </summary>
        /// <param name="type">The type.</param>
        /// <param name="context">The context.</param>
        /// <param name="formattedLines">The formatted lines.</param>
        public void WriteLogMessage(ConsoleColor color, string message)
        {
            if (IsDisposed)
                return;
            if (_failed == 1) // do not log if failed
                return;
            _logQueue.TryAdd((color, message), 0);
        }

        private void LogMethod()
        {
            try
            {
                List<(ConsoleColor color, string message)> lines = new List<(ConsoleColor color, string message)>(100);
                while (true)
                {
                    lines.Clear();
                    (ConsoleColor, string) line;
                    // wait for at least one line
                    if (_logQueue.TryTake(out line, -1, _logThreadCancelSource.Token))
                    {
                        lines.Add(line);
                        // if there are more then gather up to 100
                        while (lines.Count < 100 & _logQueue.TryTake(out line, 0, _logThreadCancelSource.Token))
                        {
                            lines.Add(line);
                        }
                    }
                    _logCounter += lines.Count;
                    EnsureWriter();
                    WriteLogLines(lines);
                }
            }
            catch (OperationCanceledException)
            {
                // do nothing if canceled or disposed, means that we are shutting down
            }
            catch (ObjectDisposedException)
            {
                // do nothing if canceled or disposed, means that we are shutting down
            }
            catch (Exception ex)
            {
                OnLoggingFailed(ex);
                // can't really do anything if we broke
            }
            finally
            {
                CloseWriter(false);
            }
        }

        private void WriteLogLines(IEnumerable<(ConsoleColor color, string message)> lines)
        {
            ConsoleColor defaultColor = ConsoleColor.Gray;
            if (_writeToConsole)
                defaultColor = Console.ForegroundColor;
            foreach (var loggedLine in lines)
            {
                _writer.WriteLine(loggedLine.Item2);
                if (_writeToConsole)
                {
                    Console.ForegroundColor = loggedLine.color;
                    Console.WriteLine(loggedLine.message);
                    Console.ForegroundColor = defaultColor;
                    System.Diagnostics.Debug.WriteLine(loggedLine.message);
                }
            }
            _writer.Flush();
        }




        /// <summary>
        /// Ensures that the file writer is ready for writing log.
        /// </summary>
        private void EnsureWriter()
        {
            // Check if we need to crate a new log file
            string fileName = _fileNamePrefix + DateTime.Today.ToString("yyyy-MM-dd");
            //string fileName = _fileNamePrefix + DateTime.Now.ToString("yyyy-MM-dd HH-mm");
            if (_currentLogFileName != fileName)
            {
                CloseWriter(AutoArchiveLog);
                _currentLogFileName = fileName;
            }
            // Open file writer if it is not open
            if (_stream == null | _writer == null)
            {
                _stream = new FileStream(CurrentLogFile, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
                _writer = new StreamWriter(_stream, Encoding.UTF8);
                _writer.AutoFlush = false;
                NewLogFileCreated?.Invoke(this, EventArgs.Empty);
                if (RemoveOldLogs)
                {
                    DeleteOldLogs();
                }
            }
        }

        private void CloseWriter(bool archive)
        {
            if (_writer != null)
            {
                try
                {
                    _writer.Close();
                    _writer.Dispose();
                    _stream.Close();
                    _stream.Dispose();
                }
                catch (Exception ex)
                {
                    // Ignore any errors when closing files
                    System.Diagnostics.Trace.WriteLine("An error occured while closing server log (" + _currentLogFileName + "): " + ex.ToString());
                }
                _writer = null;
                _stream = null;
                if (archive)
                {
                    AutoArchiveLogAsync(CurrentLogFile);
                    // just let it run in the background
                }
            }
        }

        private async void AutoArchiveLogAsync(string logFileName)
        {
            try
            {
                var log = this.CreateLogger(nameof(AsyncLoggerProvider));
                log.LogDebug("Archiving log file {logFileName} to {logFileName}.zip", logFileName, logFileName);
                using (var zip = System.IO.Compression.ZipFile.Open(logFileName + ".zip", System.IO.Compression.ZipArchiveMode.Create))
                {
                    var entry = zip.CreateEntry(Path.GetFileName(logFileName));
                    using (FileStream rStream = new FileStream(logFileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                    {
                        using (var wStream = entry.Open())
                        {
                            await rStream.CopyToAsync(wStream);
                        }
                    }
                }
                log.LogDebug("Deleting log file {logFileName}", logFileName);
                File.Delete(logFileName);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine("An error occured while trying to compress log file: " + ex.ToString());
            }
        }



        private void DeleteOldLogs()
        {
            try
            {
                var log = this.CreateLogger(nameof(AsyncLoggerProvider));
                var files = Directory.GetFiles(_logFolder, _fileNamePrefix + "*.*");
                foreach (var logFile in files)
                {
                    if (logFile == CurrentLogFile)
                        continue;
                    // never remove current log
                    FileInfo info = new FileInfo(logFile);
                    if (info.CreationTime < DateTime.Today.AddDays(-RemoveOldLogsDays))
                    {
                        //WriteLogLines(new (ConsoleColor, string)[] { (ConsoleColor.Cyan, $"Deleting old log file {logFile}") });
                        log.LogDebug("Deleting old log file {logFile}", logFile);
                        File.Delete(logFile);
                    }
                }

            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine("An error occured while trying to delete old logs: " + ex.ToString());
            }
        }


        protected virtual void OnLoggingFailed(Exception ex = null)
        {
            if (Interlocked.CompareExchange(ref _failed, 1, 0) == 0)
            {
                System.Diagnostics.Trace.WriteLine("An error occured while attempting to write a log line: " + ex.ToString());
            }
        }

        /// <summary>
        /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            if (Interlocked.CompareExchange(ref _disposed, 1, 0) == 0)
            {
                var log = this.CreateLogger(nameof(AsyncLoggerProvider));
                log.Log(LogLevel.Debug, "Dispose()");
                while (_logQueue.Count > 0 && this._logThread.IsAlive)
                {
                    Thread.Sleep(10);
                    // wait until all queued writes are completed
                }

                _logThreadCancelSource.Cancel();
                Thread.Sleep(100);
                // give it a chance to exit
                _logQueue.Dispose();
            }
        }

    }

    public class Logger : ILogger
    {
        private const int _addInfoSize = 20;
        private string _category;
        private AsyncLoggerProvider _provider;

        public Logger(AsyncLoggerProvider provider, string category)
        {
            _provider = provider;
            // Category names are pretty long as they consist of full namespace and class name, we are only interested in the last part
            _category = category?.Split('.').LastOrDefault();
            if (_category.Length > _addInfoSize)
                _category = _category.Substring(0, _addInfoSize - 2) + "..";
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            return null;
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return true;
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            if (!IsEnabled(logLevel))
                return;
            try
            {
                var ts = DateTime.Now;
                var thread = System.Threading.Thread.CurrentThread.ManagedThreadId;
                var type = "";
                var padding = "";
                ConsoleColor color = ConsoleColor.DarkGray;
                switch (logLevel)
                {
                    case LogLevel.Debug:
                        color = ConsoleColor.DarkGray;
                        type = "Dbg";
                        padding = "    ";
                        break;
                    case LogLevel.Trace:
                        color = ConsoleColor.DarkGray;
                        type = "Trc";
                        padding = "    ";
                        break;
                    case LogLevel.Warning:
                        color = ConsoleColor.Yellow;
                        type = "Wrn";
                        break;
                    case LogLevel.Error:
                        color = ConsoleColor.Red;
                        type = "Err";
                        break;
                    case LogLevel.Critical:
                        color = ConsoleColor.Red;
                        type = "Cri";
                        break;
                    case LogLevel.Information:
                        color = ConsoleColor.White;
                        type = "Inf";
                        break;
                }

                string addInfo = _category;
                var httpCtx = _provider.HttpContext?.HttpContext;
                if (httpCtx != null)
                {
                    if(httpCtx.User.Identity.IsAuthenticated)
                    {
                        addInfo = _provider.HttpContext.HttpContext.User.Identity.Name ??  
                            _provider.HttpContext.HttpContext.User.Claims.FirstOrDefault(x=>x.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                             _provider.HttpContext.HttpContext.User.Claims.FirstOrDefault(x=>x.Type == System.Security.Claims.ClaimTypes.Name)?.Value ??
                             _provider.HttpContext.HttpContext.User.Claims.FirstOrDefault(x=>x.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
                    }
                    else
                    {
                        addInfo = $"anonymous";
                    }
                    if (addInfo.Length > _addInfoSize)
                        addInfo = addInfo.Substring(0, _addInfoSize - 2) + "..";
                }

                //var msg = $"{ts:yyyy-MM-dd HH:mm:ss.fff} | {type} | {thread,5} | {_category,-_categorySize} | {userInfo,-30} | {padding}{formatter(state, exception)}";
                var msg = $"{ts:yyyy-MM-dd HH:mm:ss.fff} | {type} | {thread,5} | {addInfo,-_addInfoSize} | {padding}{formatter(state, exception)}";
                _provider.WriteLogMessage(color, msg);
                if (exception != null)
                {
                    var exceptionDetails = exception.ToString().Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var detail in exceptionDetails)
                    {
                        msg = $"{ts:yyyy-MM-dd HH:mm:ss.fff} | {type} | {thread,5} | {addInfo,-_addInfoSize} | {detail}";
                        _provider.WriteLogMessage(color, msg);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine("Failed to write log: " + ex.ToString());
                throw;
            }
        }
    }
}
