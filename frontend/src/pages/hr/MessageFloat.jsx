import message from './assets/msg.png'
import './style/index.css'
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '../../utils/permissionHelper';

function MessageFloat({onClick}){
    // Check if user has permission to use messaging
    const userPermissions = useSelector((state) => state.auth.userPermissions);
    const hasMessagingPermission = hasPermission(userPermissions, PERMISSIONS.USE_MESSAGING);
    
    // If user doesn't have permission, don't render the button
    if (!hasMessagingPermission) return null;
    
    return(
        <div className='messagingsection' onClick={onClick}>
            <img src={message} alt="Message" />
        </div>
    );
}

export default MessageFloat