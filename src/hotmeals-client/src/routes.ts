const routes = {
    homePage :  "/",
    login :  "/login",
    userAccount :  "/account",
    ordersActive:  "/orders/active",
    ordersCompleted:  "/orders/completed",
    customerRegister :  "/customer-register",
    customerSearch :  "/search/:searchQuery",
    customerOrder:  "/order",
    customerRestaurants:  "/customer-restaurants",
    ownerRegister:  "/owner-register",
    ownerBlockedUsers:  "/owner-blocked-users",
    ownerRestaurants:  "/owner-restaurants",
    ownerRestaurantMenu:  "/owner-restaurants/:restaurantId/menu",
    
    getCustomerSearch: (searchExpression: string) => `/search/${encodeURI(searchExpression.trim())}`,
    getOwnerOrdersForRestaurant: (restaurantId: string) =>  `/owner-orders/${restaurantId}`,
    getOwnerRestaurantMenu: (restaurantId: string) =>  `/owner-restaurants/${restaurantId}/menu`,
}

export default routes