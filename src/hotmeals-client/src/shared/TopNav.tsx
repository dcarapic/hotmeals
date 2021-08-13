import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import { Button, Container, Image, Modal, Navbar, NavLink } from "react-bootstrap";
import srcLogo from "../assets/Logo.svg";
import srcHotMeals from "../assets/HotMeals.svg";
import srcAccount from "../assets/Account.svg";
import { RouterNavLink } from "./RouterNav";
import { useCurrentUser } from "../user";
import routes from "../routes";

const AccountImage = () => {
    const [showMenu, setShowMenu] = useState(false);
    const currentUser = useCurrentUser();

    const logoutHandler = async () => {
        await api.userLogout();
        // we do not care if we fail the logout because the server is not available, just continue
        currentUser.setCurrentUser(null);
    }

    return (
        <Fragment>
            <Image
                role="button"
                style={{height: "40px" }}
                src={srcAccount}
                onClick={(e) => {
                    setShowMenu(true);
                }}
            />
            <Modal show={showMenu} onHide={() => setShowMenu(false)} keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>User name</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid">
                        <RouterNavLink to="/account" onClick={() => setShowMenu(false)}>
                            Account settings
                        </RouterNavLink>
                        <RouterNavLink to="/orders" onClick={() => setShowMenu(false)}>
                            Your orders
                        </RouterNavLink>
                        <NavLink onClick={logoutHandler}>Logout</NavLink>
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

const TopNav = () => {
    const currentUser = useCurrentUser();
    return (
        <Navbar bg="primary" sticky='top'>
            <Container>
                <Navbar.Brand>
                    <RouterNavLink to={routes.homePage} className="p-0">
                        <Image src={srcLogo} fluid className="me-2" style={{height: "40px" }} />
                        <Image src={srcHotMeals} style={{height: "30px" }} fluid />
                    </RouterNavLink>
                </Navbar.Brand>
                {currentUser.userData && <AccountImage />}
            </Container>
        </Navbar>
    );
};
export default TopNav;
