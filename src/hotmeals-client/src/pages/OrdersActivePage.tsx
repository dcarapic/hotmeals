import React, { Fragment } from "react";
import * as ui from "../util/ui";
import { OrderList, OrderListType } from "../shared/OrderList";

const OrdersActivePage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Your active orders</h3>
            <OrderList type={OrderListType.ActiveOrders} />
        </Fragment>
    );
});
export default OrdersActivePage;
