import {createRouteHandler} from "uploadthing/next"
import {ourFileRouter} from './core'
//Export roptues for NextAppRouter

export const {GET,POST} = createRouteHandler ({
    router: ourFileRouter,
    //Apply additional config...
})