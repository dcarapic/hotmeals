import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import * as model from "../state/model";
import { Badge, Button, Container, Image, Modal, Nav, Navbar, NavLink } from "react-bootstrap";
import srcLogo from "../assets/Logo.svg";
import srcHotMeals from "../assets/HotMeals.svg";
import { RouterNavLink } from "./RouterNav";
import { useCurrentUser } from "../state/user";
import routes from "../routes";
import { useCurrentOrder } from "../state/current-order";
import { useHistory } from "react-router-dom";
import { useNotificationSubscription } from "../util/ws-notifications";
import { useToastMessageService } from "../util/ui";

const CurrentAccountIcon = () => {
    const [showMenu, setShowMenu] = useState(false);
    const currentUser = useCurrentUser();

    const performLogout = async () => {
        setShowMenu(false);
        await api.userLogout();
        // we do not care if we fail the logout because the server is not available, just continue
        currentUser.setCurrentUser(null);
    };
    if (!currentUser.userData || currentUser.isLoading) return null;

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
                    <Modal.Title>User name</Modal.Title>
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

const CurrentOrderIcon = () => {
    const currentUser = useCurrentUser();
    const currentOrder = useCurrentOrder();
    const history = useHistory();

    if (!currentUser.userData || currentUser.isLoading || !currentOrder.order) return null;

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
                    {currentOrder.order.items.length}
                </Badge>
            </div>
        </Fragment>
    );
};

const TopNav = () => {
    const currentUser = useCurrentUser();
    const toast = useToastMessageService();

    useNotificationSubscription("OrderUpdated", (order: model.OrderDTO) => {
        console.log(`TopNav: Order updated ${order.orderId}`);
        if (!currentUser.userData) return;
        let caption = `Order - ${order.currentStatus}`;
        let description = `Order was marked as ${order.currentStatus}`;
        let variant = "light";

        if (currentUser.userData?.isRestaurantOwner) {
            if (order.currentStatus === "Placed") {
                caption = "New order!";
                description = `You have received new order for your restaurant ${order.restaurantName}.`;
            } else if (order.currentStatus === "Canceled") {
                caption = "Order has been canceled";
                description = `Unfortunately one of the orders for your restaurant ${order.restaurantName} has been canceled.`;
                variant = "warning";
            } else if (order.currentStatus === "Received") {
                caption = "Order completed";
                description = `Customer has marked your order as received. The order is completed!`;
                variant = "success";
            }
        } else {
            if (order.currentStatus === "Accepted") {
                caption = `Order - ${order.currentStatus}`;
                description = `Restaurant has accepted your order! You will get notified as the order status changes.`;
                variant = "success";
            } else if (order.currentStatus === "Delivered") {
                caption = `Order - ${order.currentStatus}`;
                description = `Restaurant has marked your order as ${order.currentStatus}. You should now mark it as received!`;
                variant = "success";
            }
        }
        toast.showToast({ caption, description, variant, createdAt: new Date() });
    }, [currentUser]);    

    return (
        <Navbar bg="primary" className="hm-sticky-height" fixed="top">
            <Container>
                <Navbar.Brand>
                    <RouterNavLink to={routes.homePage} className="p-0">
                        <Image src={srcLogo} fluid className="me-2" style={{ height: "40px" }} />
                        <Image src={srcHotMeals} style={{ height: "30px" }} fluid />
                    </RouterNavLink>
                </Navbar.Brand>
                <Nav>
                    <CurrentOrderIcon />
                    <CurrentAccountIcon />
                </Nav>
            </Container>
        </Navbar>
    );
};
export default TopNav;
