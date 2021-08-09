import React, { Fragment, useState } from "react";
import { Alert, Form,  } from "react-bootstrap";
import { FormEvent } from "react-dom/node_modules/@types/react";
import { login } from "../api";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavLink } from "../shared/RouterNav";
import { useCurrentUser } from "../user";

const LoginPage = () => {
    const currentUser = useCurrentUser();
    const [submitting, setSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);
    const [loginFailed, setLoginFailed] = useState(false);
    const [loginError, setLoginError] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();

        let email = form.formEmail.value;
        let pwd = form.formPassword.value;
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        setValidated(false);
        setSubmitting(true);
        let response = await login(email, pwd);
        if (response.ok && response.result) {
            setSubmitting(false);
            currentUser.setCurrentUser(response.result);
        } else if (response.isUnauthorized) {
            setSubmitting(false);
            setLoginFailed(true);
        } else {
            setSubmitting(false);
            setLoginError(true);
        }
    };
    return (
        <Fragment>
            <h3 className="text-center p-2">
                Welcome to HotMeals, the best place to order your hot and fast food delivery!
            </h3>
            <Form onSubmit={handleSubmit} noValidate validated={validated}>
                <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter your email" readOnly={submitting} required />
                    <Form.Control.Feedback type="invalid">Please enter your email</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter your password" readOnly={submitting} required />
                    <Form.Control.Feedback type="invalid">Please enter your password</Form.Control.Feedback>
                </Form.Group>
                <LoadingButton variant="primary" type="submit" loading={submitting} className="mb-3">
                    Login
                </LoadingButton>
            </Form>
            <Alert variant="warning" show={loginFailed}>
                You have not provided valid email or password. Please try again.
            </Alert>
            <Alert variant="danger" show={loginError}>
                An error occurred while attempting to login, please try again later.
            </Alert>
            <RouterNavLink to="/register-customer" className="text-center">
                Register as a new customer ...
            </RouterNavLink>
            <RouterNavLink to="/register-owner" className="text-center">
                Register as a new restaurant owner ...
            </RouterNavLink>
        </Fragment>
    );
};
export default LoginPage;
