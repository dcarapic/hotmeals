import React, { Fragment } from "react";
import * as ui from "../util/ui";
import { OrderList, OrderListType } from "../shared/OrderList";

const OrdersCompletedPage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Your completed orders</h3>
            <OrderList type={OrderListType.ActiveOrders} />
        </Fragment>
    );
});
export default OrdersCompletedPage;
