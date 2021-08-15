/** Application routes */
const routes = {
    /** Application home page */
    homePage :  "/",
    /** Login page */
    login :  "/login",
    /** Account page */
    userAccount :  "/account",
    /** Active orders */
    ordersActive:  "/orders/active",
    /** Completed orders */
    ordersCompleted:  "/orders/completed",
    /** Customer registration */
    customerRegister :  "/customer-register",
    /** Search page */
    customerSearch :  "/search/:searchQuery",
    /** Ordering page */
    customerOrder:  "/order",
    /** Customer restaurant selection */
    customerRestaurants:  "/customer-restaurants",
    /** Owner registration page */
    ownerRegister:  "/owner-register",
    /** Owner blocked users page */
    ownerBlockedUsers:  "/owner-blocked-users",
    /** Owner restaurants */
    ownerRestaurants:  "/owner-restaurants",
    /** Owner restaurant menu */
    ownerRestaurantMenu:  "/owner-restaurants/:restaurantId/menu",
    
    /** Gets the search page link with prefilled search expression */
    getCustomerSearch: (searchExpression: string) => `/search/${encodeURI(searchExpression.trim())}`,
    /** Get the restaurant orders link */
    getOwnerOrdersForRestaurant: (restaurantId: string) =>  `/owner-orders/${restaurantId}`,
    /** Gets the owner restaurant menu link */
    getOwnerRestaurantMenu: (restaurantId: string) =>  `/owner-restaurants/${restaurantId}/menu`,
}

export default routes