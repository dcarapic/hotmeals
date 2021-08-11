import React, { Fragment, useState } from "react";
import { Form } from "react-bootstrap";
import { FormEvent } from "react-dom/node_modules/@types/react";
import { useHistory } from "react-router-dom";
import { useAbortable, userLogin } from "../api";
import { useAppErrorUI, withAppErrorUI } from "../errorHandling";
import routes from "../routeConfig";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavLink } from "../shared/RouterNav";
import { useCurrentUser } from "../user";

const LoginPage = withAppErrorUI(() => {
    const currentUser = useCurrentUser();
    const errUI = useAppErrorUI();
    const history = useHistory();
    const abort = useAbortable();

    const [submitting, setSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();

        let email = form.formEmail.value;
        let password = form.formPassword.value;
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        setValidated(false);
        setSubmitting(true);
        errUI.clearCurrentError();
        let response = await userLogin({ email, password }, abort);
        if (response.isAborted) return;
        if (response.ok && response.result) {
            currentUser.setCurrentUser(response.result.user);
            // Go to home page
            history.push("/");

        } else if (response.isUnauthorized || response.isBadRequest) {
            setSubmitting(false);
            errUI.setCurrentError({
                caption: "Login failed",
                description: response.errorDetails,
                variant: "warning"
            });
        } else {
            setSubmitting(false);
            errUI.setCurrentError({
                caption: "Invalid server response",
                description: "Server did not provide meaningful response. Please try again.",
            }); // generic error
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
                    <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        maxLength={100}
                        readOnly={submitting}
                        required
                    />
                    <Form.Control.Feedback type="invalid">Please enter your email</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        maxLength={500}
                        readOnly={submitting}
                        required
                    />
                    <Form.Control.Feedback type="invalid">Please enter your password</Form.Control.Feedback>
                </Form.Group>
                <LoadingButton variant="primary" type="submit" loading={submitting} className="mb-3">
                    Login
                </LoadingButton>
            </Form>
            <RouterNavLink to={routes.customerRegister} className="text-center">
                Register as a new customer ...
            </RouterNavLink>
            <RouterNavLink to={routes.ownerRegister} className="text-center">
                Register as a new restaurant owner ...
            </RouterNavLink>
        </Fragment>
    );
});
export default LoginPage;
