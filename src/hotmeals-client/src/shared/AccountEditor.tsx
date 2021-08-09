import React, { FormEvent, Fragment, useState } from "react";
import { Alert, Col, Form, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { register, ServerResponseWithData, updateUser } from "../api";
import { useAppErrorUI } from "../errorHandling";
import { UserResponse } from "../types";
import { useCurrentUser } from "../user";
import { LoadingButton } from "./LoadingButton";

const AccountEditor = (props: { isRegistration: boolean; isRestaurantOwner: boolean }) => {
    const currentUser = useCurrentUser();
    const errUI = useAppErrorUI();
    const history = useHistory();

    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [validated, setValidated] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();
        errUI.clearCurrentError();

        setSaved(false);
        
        // Clear custom validity
        form.formPasswordConfirm.setCustomValidity("");

        let email : string = form.formEmail.value;
        let firstName : string = form.formFirstName.value;
        let lastName : string = form.formLastName.value;
        let addressCityZip : string = form.formAddressCityZip.value;
        let addressCity : string = form.formAddressCity.value;
        let addressStreet : string = form.formAddressStreet.value;
        let password : string = form.formPassword.value;
        let passwordConfirm : string = form.formPasswordConfirm.value;
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        // If password is set (mandatory for registration) then check that the password matches
        if(password && password !== passwordConfirm ) {
            form.formPasswordConfirm.setCustomValidity("Please enter matching password values!");
            setValidated(true);
            return;
        }

        setValidated(false);
        setSubmitting(true);
        let response : ServerResponseWithData<UserResponse>;
        if(props.isRegistration) {
            response = await register({
                email,
                firstName,
                lastName,
                addressCityZip,
                addressCity,
                addressStreet,
                password,
                isRestaurantOwner: props.isRestaurantOwner,
            });
            if (response.ok && response.result) {
                setSubmitting(false);
                currentUser.setCurrentUser(response.result);
                // Go to home page
                history.push("/");
    
            } else {
                setSubmitting(false);
                errUI.setCurrentError("Saving changes failed!", response.statusMessage); // generic error
            }
        } else {
            response = await updateUser({
                firstName,
                lastName,
                addressCityZip,
                addressCity,
                addressStreet,
                newPassword : password
            });
            if (response.ok && response.result) {
                setSubmitting(false);
                currentUser.setCurrentUser(response.result);
                setSaved(true);
    
            } else {
                setSubmitting(false);
                errUI.setCurrentError("Registration failed", response.statusMessage); // generic error
            }
        }

    };
    return (
        <Fragment>
            <Form onSubmit={handleSubmit} noValidate validated={validated}>
                <Form.Group className="mb-2" controlId="formEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        maxLength={100}
                        readOnly={submitting || !props.isRegistration}
                        defaultValue={currentUser.user?.email}
                        required
                    />
                </Form.Group>
                <Row className="mb-2">
                    <Col md={6}>
                        <Form.Group controlId="formFirstName">
                            <Form.Label>First name</Form.Label>
                            <Form.Control
                                type="text"
                                defaultValue={currentUser.user?.firstName}
                                maxLength={100}
                                readOnly={submitting}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="formLastName">
                            <Form.Label>Last name</Form.Label>
                            <Form.Control
                                type="text"
                                defaultValue={currentUser.user?.lastName}
                                maxLength={100}
                                readOnly={submitting}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-2">
                    <Col md={9}>
                        <Form.Group controlId="formAddressCity">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                                type="text"
                                defaultValue={currentUser.user?.addressCity}
                                maxLength={100}
                                readOnly={submitting}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="formAddressCityZip">
                            <Form.Label>Zip code</Form.Label>
                            <Form.Control
                                type="text"
                                defaultValue={currentUser.user?.addressCityZip}
                                maxLength={20}
                                readOnly={submitting}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-2" controlId="formAddressStreet">
                    <Form.Label>Street and number</Form.Label>
                    <Form.Control
                        type="text"
                        defaultValue={currentUser.user?.addressStreet}
                        maxLength={200}
                        readOnly={submitting}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-2" controlId="formPassword">
                    <Form.Label>
                        {props.isRegistration ? "Password" : "Enter new password value to change your password"}
                    </Form.Label>
                    <Form.Control
                        type="password"
                        placeholder={props.isRegistration ? "Enter your password" : "Change your password"}
                        maxLength={500}
                        readOnly={submitting}
                        required={props.isRegistration}
                    />
                    <Form.Control.Feedback type="invalid">Please enter your password</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-2" controlId="formPasswordConfirm">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Confirm your password"
                        maxLength={500}
                        readOnly={submitting}
                        required={props.isRegistration}
                    />
                    <Form.Control.Feedback type="invalid">Please confirm your password</Form.Control.Feedback>
                </Form.Group>
                <LoadingButton variant="primary" type="submit" loading={submitting} className="mb-3">
                    {props.isRegistration ? "Register" : "Save changes"}
                </LoadingButton>
            </Form>
            <Alert show={saved}>
                Your changes have been saved.
            </Alert>
        </Fragment>
    );
};
export default AccountEditor;
