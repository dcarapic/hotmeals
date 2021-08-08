import React, { Fragment, useState } from "react";
import { Button, Container, Image, Modal, Navbar, NavLink } from "react-bootstrap";

import srcLogo from "../assets/Logo.svg";
import srcHotMeals from "../assets/HotMeals.svg";
import srcAccount from "../assets/Account.svg";
import RouterNavLink from "./RouterNavLink";
import { useApplicationState } from "../model/ApplicationState";
import { observer } from "mobx-react-lite";

const AccountMenu = () => {
    const [showMenu, setShowMenu] = useState(false);
    return (
        <Fragment>
            <Image
                role="button"
                src={srcAccount}
                onClick={(e) => {
                    setShowMenu(true);
                    //setTarget(e.target);
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
                        <NavLink onClick={() => alert("Logout!")}>Logout</NavLink>
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

const TopNav = observer(() => {
    const appState = useApplicationState();
    return (
        <Navbar bg="primary">
            <Container fluid>
                <Navbar.Brand>
                    <RouterNavLink to="/" className="p-0">
                        <Image src={srcLogo} className="me-2" />
                        <Image src={srcHotMeals} />
                    </RouterNavLink>
                </Navbar.Brand>
                {appState.currentUser && <AccountMenu />}
            </Container>
        </Navbar>
    );
});
export default TopNav;
