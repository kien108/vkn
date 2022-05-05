import React from "react";
import ProfilePreview from "../../Profile/ProfilePreview/ProfilePreview";
import avatar from "../../../assets/images/profile.jpg";
import "./comment.scss";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

const Comment = (props) => {
   const { user, hideSubComments } = props;
   return (
      <div className="message-container">
         <ProfilePreview
            username={user.username}
            iconSize="medium"
            image={avatar}
            hideAccountName={true}
         />
         <div className="message__content">
            <div className="message__content-header">
               <span className="username">
                  {user.username || "kien.letrung.376258"}
               </span>
               Học hành mệt quá thì qua room39 mình có mở khoá phụ hồ nha :v
            </div>
            <div className="message__content-footer">
               <span className="message-footer-time">1h</span>
               <span className="message-footer-reply">Reply</span>
               <MoreHorizIcon className="message-footer-option" />
            </div>
            <span
               className={`message-view-reply ${
                  hideSubComments ? "display-none" : ""
               } `}
            >
               <span></span>
               View replies (3)
            </span>
         </div>
      </div>
   );
};

export default Comment;