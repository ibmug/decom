import { Metadata } from "next";
import ProfileForm from "./profile-form";

export const metadata: Metadata = {
    title: 'User Profile'
}



const ProfilePage = async () => {
    

    return (
        <div className="max-w-md mx-auto space-y-4">
            <ProfileForm/>
        </div>
    );
}
 
export default ProfilePage;