import { H1 } from '@govuk-react/heading';
import { ReactElement } from 'react';
import Button from '@govuk-react/button';
import { useForm } from 'react-hook-form';
import { addUserToPool, getCognitoClientAndUserPool } from '../data/cognito';

export interface FormUser {
    email: string;
    nocs: string;
}

const formatNocs = (nocs: string): string =>
    nocs
        .split(',')
        .map((noc) => noc.trim())
        .join('|');

const AddUser = (): ReactElement => {
    const { register, handleSubmit, reset } = useForm<FormUser>();
    const onSubmit = async (formUser: FormUser) => {
        const formattedUser = { ...formUser, nocs: formatNocs(formUser.nocs) };
        const { client, userPoolId } = await getCognitoClientAndUserPool();
        if (userPoolId) {
            const response = await addUserToPool(client, userPoolId, formattedUser);
            console.log(response);
        }
        reset();
    };

    return (
        <>
            <H1>Add User</H1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <label htmlFor="email">User Email</label>
                <br />
                <input id="email" name="email" ref={register({ required: true })} />
                <br />
                <br />
                <label htmlFor="email">User National Operator Code (NOC)</label>
                <br />
                <small>
                    If the user has multiple NOCs, enter a comma-separated list. For example, &apos;NOC1,NOC2,NOC3&apos;
                </small>
                <br />
                <input id="nocs" name="nocs" ref={register({ required: true })} />
                <br />
                <br />
                <Button>Submit</Button>
            </form>
        </>
    );
};

export default AddUser;
