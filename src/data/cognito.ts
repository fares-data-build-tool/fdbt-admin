import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Auth } from 'aws-amplify';
import {
    AdminCreateUserRequest,
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
    const params: ListUsersRequest = {
        UserPoolId: userPoolId,
    };

    const listUsersResponse = await cognito.listUsers(params).promise();

    return listUsersResponse?.Users ?? [];
};

const generateTemporaryPassword = (): string =>
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const addUserToPool = async (
    cognito: CognitoIdentityServiceProvider,
    userPoolId: string,
    formUser: FormUser,
): Promise<void> => {
    const params: AdminCreateUserRequest = {
        UserPoolId: userPoolId,
        Username: formUser.email,
        UserAttributes: [{ Name: 'custom:noc', Value: formUser.nocs }],
        TemporaryPassword: generateTemporaryPassword(),
    };

    await cognito.adminCreateUser(params).promise();
};
