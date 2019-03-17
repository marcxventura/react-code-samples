import React from "react";
import * as profileService from "../../services/profileService";
import * as customerOrdersService from "../../services/customerOrdersService";
import "../../assets/scss/style.css";
import "./customer.module.css";
import PageLoader from "../ui/PageLoader";
import DashboardProfile from "./DashboardProfile";
import CustomerOrdersSummary from "./CustomerOrdersSummary";
import DashboardEmailChat from "./DashboardEmailChat";
import DashboardOrdersSearch from "./DashboardOrdersSearch";
import ProfileForm from "../Profile/ProfileForm";
import logger from "../../logger";

const _logger = logger.extend("Customer Dashboard");

class CustomerDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: [],
      role: 2,
      orders: [],
      existing: false,
      isLoading: true,
      photo: true,
      noResultsFound: "There were no results found."
    };
  }

  componentDidMount() {
    this.displayCurrentUser();
    this.displayCustomerOrdersSummary();
  }

  displayCurrentUser = () => {
    profileService
      .getByUserId()
      .then(this.onGetCurrentUserIdSuccess)
      .catch(this.onGetCurrentUserIdFail);
  };

  displayCustomerOrdersSummary = () => {
    customerOrdersService
      .getSummary()
      .then(this.onGetOrdersSummarySuccess)
      .catch(this.onGetOrdersSummaryFail);
  };

  onGetOrdersSummarySuccess = data => {
    _logger("Customer Orders Summary: ", data);

    this.setState({
      orders: data.items,
      orderSummaryExists: true
    });
  };

  onGetOrdersSummaryFail = err => {
    _logger("Failed Customer Orders Summary: " + err);
  };

  onGetCurrentUserIdSuccess = data => {
    _logger(`Current User Data: ${data.item.id}`, data);
    const res = data.item;
    if (res.avatarUrl === "") {
      this.setState({
        photo: false
      });
    }
    this.setState({
      user: {
        id: res.id,
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        avatarUrl: res.avatarUrl,
        description: res.description,
        dob: res.dob,
        phoneNumber: res.phoneNumber,
        email: res.email
      },
      existing: true,
      isLoading: false
    });
  };

  onGetCurrentUserIdFail = error => {
    this.setState({
      existing: false,
      isLoading: false
    });
    _logger(`Failed To Get Current User Id: `, error);
  };

  onUpdateAvatar = userAvatar => {
    const newUserState = { ...this.state.user };

    newUserState.avatarUrl = userAvatar.avatarUrl;

    this.setState({
      user: newUserState
    });
  };

  render() {
    const { noResultsFound, orders, user, role, photo } = this.state;
    return (
      <div>
        {this.state.isLoading ? (
          <PageLoader />
        ) : this.state.existing ? (
          <React.Fragment>
            <div className="row">
              <DashboardProfile
                {...this.props}
                displayCurrentUser={this.displayCurrentUser}
                updateAvatar={this.onUpdateAvatar}
                user={user}
                role={role}
                photo={photo}
              />
              <CustomerOrdersSummary
                orders={orders}
                noResultsFound={noResultsFound}
              />
              <DashboardEmailChat />
              <DashboardOrdersSearch />
            </div>
          </React.Fragment>
        ) : (
          <div>
            <ProfileForm displayCurrentUser={this.displayCurrentUser} />
          </div>
        )}
      </div>
    );
  }
}

export default CustomerDashboard;
