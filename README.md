# HotMeals

HotMeals is an example online food ordering and order management application. 
The application consists of two separate projects:
- **hotmeals-client**: A single page application developed in React framework
- **hotmeals-server**: A REST backend service developed in .NET Core 5.0

If you are interested in application end user functionality then please read the [User guide](docs/user_guide.md).

## Prerequisites

In order to compile the application you must have the following software installed:
- Node (latest stable version) with NPM package manager. Latest version is available here [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
- .NET SDK 5 (latest stable version). Latest version is available here [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download).


## Setup

After downloading/cloning the repository you have to run the following command in order to compile/build the application:

```
cd src\hotmeals-react
npm install

cd ..
cd hotmeals-client
dotnet restore
```

This will prepare the development environment. You may now use a tool of your choice to edit the source code.

## Technical details

### React front-end

The front-end part is a React application. The React part was initially generated via react-scripts.
Typescript is used for all React components and all other source code.
In addition to React the following NPM packages are being used:
- **boostrap** - Bootstrap 5 is used for styling and for controls
- **boostrap-icons** - Wherever an icon element is displayed it is a bootstrap icon web-font character.
- **lodash** - Installed but not used for anything at the moment.
- **react-bootstrap** - React wrapper components for the Bootstrap framework.
- **react-router-dom** - React router enables splitting the application into pages where each one has its own url.
- **typescript** - The application is written in typescript so we need it.

Besides the standard create-react-app script the only additional customization is an addition of `.eslintrc.json` file which enables full hook validation for some of the custom hooks used within the application.


### .NET back-end

The back-end is a .NET Core ASP.NET WebAPI application. The application was initially generated via default `webapi` template of the dotnet cli tool.
The back-end provides the following functionality:
- It serves the React SPA application (static files compiled via React build process) on the root route (`/`)
- Provides REST api for all functionality required by the front end application on the API route (`/api`)

SQLite is used as a storage engine. To minimize setup a sample already generated sqlite database is provided (`./db/hotmeals.sqlite`) and used for development and is also copied to the deployment folder to be used as a sample application in production.


### Authentication / Authorization

The application uses JWT bearer tokens for authentication. The API provides end-points for registration and login. 
The generated JWT token also contains the user role (Customer or Restaurant owner) which is then used to authorize user actions.
The generated JWT token lasts for 7 days. The client application stores the token in local storage so that the user does not need to login for at least 7 days.
If the user performs log out action the token is removed from local storage.
There is no token refreshing functionality.

## Building / deployment

A powershell script `build.ps1` is available in the `./src/` folder.
Running the script will perform the following:

- Build the React client application by running `npm build` in the `./src/hotmeals-server` folder.
- Build the .NET server application by running `dotnet build` in the `/src/hotmeals-server` folder.
- Copy the build output from both applications and place it in `./deploy` folder.

After this the `./deploy` folder will contain the .NET server application which will also host the React files.
You can copy the folder to your server.
Note: By default the application is for the architecture of the machine where the build takes place. Should you wish to make a build for another architecture (linux) you must edit the `build.ps1` and add `-r linux-x64` parameter to `dotnet publish` command.

## Configuration

By default the .NET application uses settings from `appsettings.json`.
When deployed the settings in `appsettings.Production.json` will override any settings in `appsettings.json`. 
When developing the settings in `appsettings.Development.json` will override any settings in `appsettings.json`. 
You are free to change / remove these files as needed. You can check the .NET configuration documentation for more information

The available configuration settings are as follows:
- **Jwt:Key** - Secret key used to encrypt the JWT authentication token.
- **Jwt:Issuer** - JWT issuer. Not important for the application at the moment.
- **Jwt:Audience** - JWT issuer. Not important for the application at the moment.
- **ConnectionString:DefaultConnection** - Connection string for the SQLite database.
- **LogFolder** - Application has a simplified log which logs to the provided log folder.


## Testing

There are no tests of any kind for the React front-end part. 
There is a separate test project for the .NET back-end application **hotmeals-server.tests**.

Tests can be run via the following command:
````
cd ./src/hotmeals-server.tests
dotnet test
````
You can then check the command output to see if all tests are passing.

Testing project uses ASP.Net built in testing framework which runs the whole server in memory and provides full HTTP access to rest services. 
This means that all tests are integration tests and full execution path (including correct HTTP method and authentication tokens) is always executed.
The only difference between the application running in test and in production is that the test framework uses an in-memory database as replacement for the full SQLite database.
