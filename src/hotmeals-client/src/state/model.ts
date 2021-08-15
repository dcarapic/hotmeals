
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

export type MenuItemBase = {
    menuItemId: string;
    restaurantId : string;
    name: string;
    description: string;
    price: number;

}

export type MenuItemDTO = MenuItemBase;

export type BlockedUserDTO = {
    email: string;
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    blockedDate: Date;
};

export type SearchResultItemDTO = MenuItemBase & {
    restaurantName: string;
};

export type NewOrder = {
    restaurantId: string
    restaurantName: string;
    readonly items: NewOrderItem[];
    readonly total: number;
};

export type NewOrderItem = MenuItemBase & {
    quantity : number;
}


export type OrderStatus = 'Placed' | 'Accepted' | 'Shipped' | 'Delivered' | 'Received' | 'Canceled';

export function isOrderStatusActive(status : OrderStatus) : boolean {
    return status !== 'Canceled' && status !== 'Received';
}

export function isOrderActive(order: OrderDTO) : boolean {
    return isOrderStatusActive(order.currentStatus);
}


export type OrderDTO = {
    orderId: string;
    restaurantId: string
    restaurantName: string;
    customerId: string;
    customerEmail: string
    customerFirstName: string;
    customerLastName: string;
    currentStatus: OrderStatus;
    createdAt: string;
    items: OrderItemDTO[];
    history: OrderHistoryDTO[];
    total: number;
};

export type OrderHistoryDTO = {
    status: OrderStatus;
    changedAt: string;
};


export type OrderItemDTO = {
    name: string;
    description: string;
    price: number;
    position: number
    quantity : number;
}


