import React, { FormEvent, Fragment, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import routes from "../routes";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavLink } from "../shared/RouterNav";
import { setCurrentUser } from "../state/user";

const LoginPage = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const history = useHistory();
    const abort = ui.useAbortable();

    const [submitting, setSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);

    const login = async (e: FormEvent) => {
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
        msgs.clearMessage();
        let response = await api.userLogin({ email, password }, abort);
        if (response.isAborted) return;
        setSubmitting(false);
        msgs.setMessageFromResponse(response);

        if (response.ok && response.result) {
            setCurrentUser(response.result.user);
            // Go to home page
            history.push("/");
        }
    };
    return (
        <Fragment>
            <h3 className="text-center p-2">
                Welcome to HotMeals, the best place to order your hot and fast food delivery!
            </h3>
            <Form onSubmit={login} noValidate validated={validated}>
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
