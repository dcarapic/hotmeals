const routes = {
    homePage :  "/",
    login :  "/login",
    userAccount :  "/account",
    customerRegister :  "/customer-register",
    customerSearch:  "/customer-search",
    customerOrder:  "/customer-order",
    customerRestaurants:  "/customer-restaurants",
    customerOrders:  "/customer-orders",
    ownerRegister:  "/owner-register",
    ownerOrders:  "/owner-orders",
    ownerRestaurantOrders:  "/owner-orders/:id",
    ownerBlockedUsers:  "/owner-blocked-users",
    ownerRestaurants:  "/owner-restaurants",
    ownerRestaurantMenu:  "/owner-restaurants/:id/menu",
    
    getOwnerOrdersForRestaurant: (restaurantId: string) =>  `/owner-orders/${restaurantId}`,
    getOwnerRestaurantMenu: (restaurantId: string) =>  `/owner-restaurants/${restaurantId}/menu`,
}

export default routes