import { H1 } from '@govuk-react/heading';
import { Fragment, ReactElement, useEffect, useState } from 'react';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Auth } from 'aws-amplify';
import { AttributeListType, ListUsersRequest, UsersListType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import Table from '@govuk-react/table';
import { ATTRIBUTE_MAP, AWS_REGION, MAIN_USER_POOL_PREFIX, STATUS_MAP } from '../constants';

const formatAttributes = (attributes: AttributeListType) => {
    return attributes
        .filter((attribute) => ATTRIBUTE_MAP[attribute.Name])
        .map((attribute) => (
            <Fragment key={attribute.Name}>
                <span>
                    <strong>{ATTRIBUTE_MAP[attribute.Name]}</strong>: {attribute.Value}
                </span>
                <br />
            </Fragment>
        ));
};

const ListUsers = (): ReactElement => {
    const [users, setUsers] = useState<UsersListType>([]);

    useEffect(() => {
        const getUsers = async (): Promise<UsersListType> => {
            const cognito = new CognitoIdentityServiceProvider({
                region: AWS_REGION,
                credentials: await Auth.currentUserCredentials(),
            });

            const userPoolList = await cognito.listUserPools({ MaxResults: 2 }).promise();
            const mainUserPool = userPoolList?.UserPools?.find((pool) => pool.Name?.startsWith(MAIN_USER_POOL_PREFIX));

            if (mainUserPool?.Id) {
                const listUserParams: ListUsersRequest = {
                    UserPoolId: mainUserPool.Id,
                };

                return (await cognito.listUsers(listUserParams).promise()).Users || [];
            }

            return [];
        };

        getUsers()
            .then((data) => setUsers(data))
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error(err);

                setUsers([]);
            });
    }, []);

    return (
        <>
            <H1>User List</H1>
            <Table>
                <Table.Row>
                    <Table.CellHeader>Email</Table.CellHeader>
                    <Table.CellHeader>Attributes</Table.CellHeader>
                    <Table.CellHeader>Status</Table.CellHeader>
                </Table.Row>
                {users.map((user) => (
                    <Table.Row key={user.Username}>
                        <Table.Cell>{user.Attributes?.find((item) => item.Name === 'email')?.Value}</Table.Cell>
                        <Table.Cell>{formatAttributes(user.Attributes || [])}</Table.Cell>
                        <Table.Cell>{STATUS_MAP[user.UserStatus || ''] ?? 'Unknown'}</Table.Cell>
                    </Table.Row>
                ))}
            </Table>
        </>
    );
};

export default ListUsers;
