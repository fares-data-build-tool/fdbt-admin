import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Auth } from 'aws-amplify';
import {
    AdminCreateUserRequest,
    AdminUpdateUserAttributesRequest,
    ListUserPoolsRequest,
    ListUsersRequest,
    UserPoolDescriptionType,
    UserType,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { AWS_REGION } from '../constants';
import { FormUser } from '../pages/AddUser';

export const getCognitoClient = async (): Promise<CognitoIdentityServiceProvider> =>
    new CognitoIdentityServiceProvider({ region: AWS_REGION, credentials: await Auth.currentUserCredentials() });

export const getUserPoolList = async (cognito: CognitoIdentityServiceProvider): Promise<UserPoolDescriptionType[]> => {
    const params: ListUserPoolsRequest = { MaxResults: 5 };

    const listUserPoolsResponse = await cognito.listUserPools(params).promise();

    return listUserPoolsResponse?.UserPools ?? [];
};

export const listUsersInPool = async (
    cognito: CognitoIdentityServiceProvider,
    userPoolId: string,
): Promise<UserType[]> => {
    const users: UserType[] = [];

    const getUsersWithPaginationToken = async (paginationToken: string | undefined) => {
        const params: ListUsersRequest = {
            UserPoolId: userPoolId,
            PaginationToken: paginationToken,
        };

        const listUsersResponse = await cognito.listUsers(params).promise();

        if (listUsersResponse.Users) {
            users.push(...listUsersResponse.Users);

            if (listUsersResponse.PaginationToken) {
                await getUsersWithPaginationToken(listUsersResponse.PaginationToken);
            }
        }
    };

    await getUsersWithPaginationToken(undefined);

    return users;
};

const generateTemporaryPassword = (): string =>
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const addUserToPool = async (
    cognito: CognitoIdentityServiceProvider,
    userPoolId: string,
    formUser: FormUser,
): Promise<void> => {
    const createUserParams: AdminCreateUserRequest = {
        UserPoolId: userPoolId,
        Username: formUser.email,
        UserAttributes: [{ Name: 'custom:noc', Value: formUser.nocs }],
        TemporaryPassword: generateTemporaryPassword(),
    };
    await cognito.adminCreateUser(createUserParams).promise();

    const updateAttributesParams: AdminUpdateUserAttributesRequest = {
        UserPoolId: userPoolId,
        Username: formUser.email,
        UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
    };
    await cognito.adminUpdateUserAttributes(updateAttributesParams).promise();
};
