import "./editProfile.scss";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import React, { useState } from "react";
import ProfilePreview from "../Profile/ProfilePreview/ProfilePreview";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import TextField from "@mui/material/TextField";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const EditProfile = () => {
   const user = useSelector((state) => state.user);
   const [formInfos, setFormInfos] = useState({
      name: user.name,
      username: user.username,
      bio: user.bio,
      dob: new Date(),
      gender: user.gender,
   });

   const handelSubmit = (e) => {
      e.preventDefault();
      console.log(formInfos);
   };
   return (
      <>
         <Header />
         <div className="edit-profile-container">
            <div className="edit-profile__body">
               <div className="body__left">
                  <ul className="body__left-options">
                     <NavLink
                        exact
                        to="/profile/edit"
                        activeClassName="body__left-options--active"
                     >
                        <li className="body__left-options-edit-profile ">
                           Edit Profile
                        </li>
                     </NavLink>

                     <NavLink
                        to="/profile/edit/password"
                        activeClassName="body__left-options--active"
                     >
                        <li className="body__left-options-change-password">
                           Change Password
                        </li>
                     </NavLink>
                     <NavLink
                        to="/profile/edit/email"
                        activeClassName="body__left-options--active"
                     >
                        <li className="body__left-options-change-email">
                           Change Email
                        </li>
                     </NavLink>
                  </ul>
               </div>
               <div className="body__right">
                  <ProfilePreview
                     username={user.username}
                     name="Change Profile Photo"
                     iconSize="medium"
                     captionSize="small"
                  />
                  <form
                     className="right__form"
                     onSubmit={(e) => handelSubmit(e)}
                  >
                     <div className="form__name">
                        <span className="form__name-label">Name</span>
                        <div className="form__name-content">
                           <input
                              type="text"
                              value={formInfos.name}
                              onChange={(e) =>
                                 setFormInfos({
                                    ...formInfos,
                                    name: e.target.value,
                                 })
                              }
                           />
                           <span className="form__name-content-description">
                              Help people discover your account by using the
                              name you're known by: either your full name,
                              nickname, or business name.
                           </span>
                        </div>
                     </div>
                     <div className="form__username">
                        <span className="form__username-label">Username</span>
                        <div className="form__username-content">
                           <input
                              type="text"
                              value={formInfos.username}
                              onChange={(e) =>
                                 setFormInfos({
                                    ...formInfos,
                                    username: e.target.value,
                                 })
                              }
                           />
                           <span className="form__name-content-description">
                              In most cases, you'll be able to change your
                              username back to undefined for another undefined
                              days.
                           </span>
                        </div>
                     </div>
                     <div className="form__bio">
                        <span className="form__bio-label">Bio</span>
                        <div className="form__bio-content">
                           <textarea
                              type="text"
                              rows={3}
                              value={formInfos.bio || ""}
                              onChange={(e) =>
                                 setFormInfos({
                                    ...formInfos,
                                    bio: e.target.value,
                                 })
                              }
                           />
                           <span className="form__bio-content-description">
                              <span>Personal Information</span> Provide your
                              personal information, even if the account is used
                              for a business, a pet or something else. This
                              won't be a part of your public profile.
                           </span>
                        </div>
                     </div>
                     <div className="form__dob">
                        <span className="form__dob-label">DoB</span>

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                           <DatePicker
                              views={["day", "month", "year"]}
                              value={formInfos.dob}
                              onChange={(newValue) => {
                                 setFormInfos({ ...formInfos, dob: newValue });
                              }}
                              renderInput={(params) => (
                                 <TextField {...params} helperText={null} />
                              )}
                           />
                        </LocalizationProvider>
                     </div>
                     <div className="form__gender">
                        <span className="form__gender-label">Gender</span>
                        <div className="form__gender-content">
                           <select
                              value={formInfos.gender || ""}
                              onChange={(e) =>
                                 setFormInfos({
                                    ...formInfos,
                                    gender: e.target.value,
                                 })
                              }
                           >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                           </select>
                        </div>
                     </div>
                     <button className="form__submit">Submit</button>
                  </form>
               </div>
            </div>
         </div>
         <Footer />
      </>
   );
};

export default EditProfile;
