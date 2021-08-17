import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import * as model from "../state/model";
import { Badge, Button, Container, Image, Modal, Nav, Navbar, NavLink } from "react-bootstrap";
import srcLogo from "../assets/Logo.svg";
import srcHotMeals from "../assets/HotMeals.svg";
import { RouterNavLink } from "./RouterNav";
import { clearCurrentUser, useCurrentUser } from "../state/user";
import routes from "../routes";
import { useCurrentOrder } from "../state/current-order";
import { useHistory } from "react-router-dom";
import { useEventEffect } from "../util/ws-events";
import { useAbortableLoad } from "../util/abortable";

// TODO: Finish breadcrumbs

/** Navbar component */
const TopNav = () => {
    //const loc = useLocation();
    return (
        <div className="sticky-top">
            <Navbar bg="primary">
                <Container>
                    <Navbar.Brand>
                        <RouterNavLink to={routes.homePage} className="p-0">
                            <Image src={srcLogo} fluid className="me-2" style={{ height: "40px" }} />
                            <Image src={srcHotMeals} style={{ height: "30px" }} fluid />
                        </RouterNavLink>
                    </Navbar.Brand>
                    <Nav>
                        <CurrentOrderIcon />
                        <ActiveOrdersIcon />
                        <CurrentAccountIcon />
                    </Nav>
                </Container>
            </Navbar>
            <div className="bg-info text-light">
                <Container>
                    <RouterNavLink to={routes.homePage} className="link-dark my-0 py-0 mb-1">
                        Home
                    </RouterNavLink>
                </Container>
            </div>
        </div>
    );
};
export default TopNav;

/** Current user icon. Also responsible for displaying the user menu. */
const CurrentAccountIcon = () => {
    const [showMenu, setShowMenu] = useState(false);
    const currentUser = useCurrentUser();

    const performLogout = async () => {
        setShowMenu(false);
        await api.userLogout();
        // we do not care if we fail the logout because the server is not available, just continue
        clearCurrentUser();
    };
    if (!currentUser) return null;

    return (
        <Fragment>
            <i
                role="button"
                className="bi bi-person-circle text-white hm-navbar-icon"
                onClick={(e) => {
                    setShowMenu(true);
                }}></i>
            <Modal show={showMenu} onHide={() => setShowMenu(false)} keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid">
                        <RouterNavLink to={routes.userAccount} onClick={() => setShowMenu(false)}>
                            Account settings
                        </RouterNavLink>
                        <NavLink onClick={performLogout}>Logout</NavLink>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMenu(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

/** Current order icon. Displayed if there is a current order. Displays a small badge with the number of currently ordered items. */
const CurrentOrderIcon = () => {
    const currentUser = useCurrentUser();
    const currentOrder = useCurrentOrder();
    const history = useHistory();

    if (!currentUser || !currentOrder) return null;

    const goToOrder = () => {
        history.push(routes.customerOrder);
    };

    return (
        <Fragment>
            <i
                role="button"
                className="bi bi-basket text-white hm-navbar-icon me-2"
                onClick={(e) => {
                    goToOrder();
                }}></i>
            <div className="hm-navbar-badge">
                <Badge pill bg="dark">
                    {currentOrder.items.length}
                </Badge>
            </div>
        </Fragment>
    );
};

/** Current order icon. Displayed if there is a current order. Displays a small badge with the number of currently ordered items. */
const ActiveOrdersIcon = () => {
    const currentUser = useCurrentUser();
    const history = useHistory();
    const [activeOrders, setActiveOrders] = useState<model.OrderDTO[]>([]);
    const [hasMorePages, setHasMorePages] = useState<boolean>();

    useAbortableLoad(
        async (signal) => {
            if (!currentUser) return;
            let response = await api.ordersFetchActive(1, signal);
            if (response.isAborted) return;
            if (response.ok && response.result) {
                setActiveOrders(response.result.orders);
                setHasMorePages(response.result.totalPages > 1);
            }
        },
        [currentUser]
    );

    // Update the list when we determine that an order has been updated
    useEventEffect(
        (order: model.OrderDTO) => {
            setActiveOrders((current) => {
                if (!model.isOrderActive(order)) {
                    let item = current.find((x) => x.orderId === order.orderId);
                    if (!item) {
                        return current;
                    } else {
                        let copy = [...current];
                        copy.splice(copy.indexOf(item), 1);
                        return copy;
                    }
                } else {
                    let copy = [...current];
                    let item = current.find((x) => x.orderId === order.orderId);
                    if (item) copy[copy.indexOf(item)] = order;
                    else copy.push(order);
                    return copy;
                }
            });
        },
        [],
        "OrderUpdated"
    );

    if (!currentUser) return null;

    const goToActiveOrders = () => {
        history.push(routes.ordersActive);
    };
    return (
        <Fragment>
            <i
                role="button"
                className="bi bi-truck text-white hm-navbar-icon me-2"
                onClick={(e) => {
                    goToActiveOrders();
                }}></i>
            <div className="hm-navbar-badge">
                <Badge pill bg="dark">
                    {activeOrders.length}
                    {hasMorePages && "+"}
                </Badge>
            </div>
        </Fragment>
    );
};
