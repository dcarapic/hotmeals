import React, { Fragment, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { FormEvent } from "react-dom/node_modules/@types/react";
import { login } from "../api";
import Loading from "../shared/Loading";
import RouterNavLink from "../shared/RouterNavLink";
import { useCurrentUser } from "../user";

const LoginPage = () => {
    const currentUser = useCurrentUser();
    let [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        let form: any = e.target;
        let email = form.formEmail.value;
        let pwd = form.formPassword.value;
        //alert(`${email} / ${pwd}`);
        e.preventDefault();
        e.stopPropagation();
        setSubmitting(true);
        let response = await login(email, pwd);
        if (response.ok && response.result) {
            setSubmitting(false);
            currentUser.setCurrentUser(response.result);
        } else {
            setSubmitting(false);
        }
    };
    return (
        <Fragment>
            <h3 className="text-center p-2">
                Welcome to HotMeals, the best place to order your hot and fast food delivery!
            </h3>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter your email" readOnly={submitting} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter your password" readOnly={submitting} />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? (
                        <Fragment>
                            <Loading variant="light" style={{ width: "1.2rem" }} />
                            Please wait
                        </Fragment>
                    ) : (
                        <Fragment>Login</Fragment>
                    )}
                </Button>
            </Form>
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
