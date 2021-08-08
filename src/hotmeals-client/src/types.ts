export type LoginRequestDTO = {
    email: string;
    password: string;
}

export type UserDTO = {
    email: string;
    firstName: string;
    lastName: string;
    isRestaurantOwner: boolean;
}