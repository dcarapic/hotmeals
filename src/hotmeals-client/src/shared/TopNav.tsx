import React, { Fragment, useState } from "react";
import { Button, Container, Image, Modal, Navbar, NavLink } from "react-bootstrap";

import srcLogo from "../assets/Logo.svg";
import srcHotMeals from "../assets/HotMeals.svg";
import srcAccount from "../assets/Account.svg";
import { RouterNavLink } from "./RouterNav";
import { useCurrentUser } from "../user";
import { userLogout } from "../util/api";

const AccountImage = () => {
    const [showMenu, setShowMenu] = useState(false);
    const currentUser = useCurrentUser();

    const logoutHandler = async () => {
        await userLogout();
        // we do not care if we fail the logout because the server is not available, just continue
        currentUser.setCurrentUser(null);
    }

    return (
        <Fragment>
            <Image
                role="button"
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
        <Navbar bg="primary">
            <Container fluid>
                <Navbar.Brand>
                    <RouterNavLink to="/" className="p-0">
                        <Image src={srcLogo} className="me-2" />
                        <Image src={srcHotMeals} />
                    </RouterNavLink>
                </Navbar.Brand>
                {currentUser.userData && <AccountImage />}
            </Container>
        </Navbar>
    );
};
export default TopNav;
