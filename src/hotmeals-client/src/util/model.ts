
export type UserDTO = {
    email: string;
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    password: string;
    isRestaurantOwner: boolean;
};

export type RestaurantDTO = {
    id: string;
    name: string;
    description: string;
    phoneNumber: string;
};

export type MenuItemDTO = {
    id: string;
    restaurantId : string;
    name: string;
    description: string;
    price: number;
};

export type BlockedUserDTO = {
    email: string;
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    blockedDate: Date;
};


export type OrderSelectionMenuItemDTO = {
    id: string;
    restaurantId: string
    restaurantName: string;
    name: string;
    description: string;
    price: number;
};