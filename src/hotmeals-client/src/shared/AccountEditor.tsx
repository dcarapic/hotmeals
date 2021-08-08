import React, { Fragment } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";

const AccountEditor = () => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
                Welcome to HotMeals, the best place to order your hot and fast food delivery!
            </h3>
            <Form>
                <Form.Group className="mb-2" controlId="formEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter your email" />
                </Form.Group>
                <Row className="mb-2">
                    <Col md={6}>
                        <Form.Group controlId="formFirstName">
                            <Form.Label>First name</Form.Label>
                            <Form.Control type="text" />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="formLastName">
                            <Form.Label>Last name</Form.Label>
                            <Form.Control type="text" />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-2">
                    <Col md={9}>
                        <Form.Group controlId="formCity">
                            <Form.Label>City</Form.Label>
                            <Form.Control type="text" />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="formCityZip">
                            <Form.Label>Zip code</Form.Label>
                            <Form.Control type="number" />
                        </Form.Group>
                    </Col>
                </Row>                
                <Form.Group className="mb-2" controlId="formStreet">
                    <Form.Label>Street and number</Form.Label>
                    <Form.Control type="text" />
                </Form.Group>

                <Form.Group className="mb-2" controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter your password" />
                </Form.Group>

                <Form.Group className="mb-2" controlId="formPassword">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control type="password" placeholder="Enter your password" />
                </Form.Group>                
                <Button variant="primary" type="submit">
                    Register
                </Button>
            </Form>
        </Fragment>
    );
};
export default AccountEditor;
