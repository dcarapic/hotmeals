import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import { Badge, Button, Container, Image, Modal, Nav, Navbar, NavLink } from "react-bootstrap";
import srcLogo from "../assets/Logo.svg";
import srcHotMeals from "../assets/HotMeals.svg";
import { RouterNavLink } from "./RouterNav";
import { useCurrentUser } from "../state/user";
import routes from "../routes";
import { useCurrentOrder } from "../state/current-order";
import { useHistory } from "react-router-dom";

const CurrentAccountIcon = () => {
    const [showMenu, setShowMenu] = useState(false);
    const currentUser = useCurrentUser();

    if (!currentUser.userData || currentUser.isLoading) return null;

    const performLogout = async () => {
        setShowMenu(false);
        await api.userLogout();
        // we do not care if we fail the logout because the server is not available, just continue
        currentUser.setCurrentUser(null);
    };

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
                <Badge pill bg="dark" >
                    {currentOrder.order.items.length}
                </Badge>
            </div>
        </Fragment>
    );
};

const TopNav = () => {
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
