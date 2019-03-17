import React from "react";
import * as customerOrdersService from "../../services/customerOrdersService";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import MapCustomerOrders from "./MapCustomerOrders";
import NoResultsTable from "./NoResultsTable";
import { DateRangePicker } from "react-dates";
import styles from "./customer.module.css";
import PropTypes from "prop-types";
import logger from "../../logger";

const _logger = logger.extend("CustomerOrders");

class CustomerOrders extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: null,
      ordersDisplay: [],
      pageIndex: 0,
      totalPages: 1,
      hideCalendar: true,
      datePicker: [],
      orderId: null,
      startDate: "",
      endDate: "",
      disableButton: false,
      searchQuery: ""
    };
  }

  componentDidMount() {
    this.displayCustomerOrders(0);
  }

  displayCustomerOrders = index => {
    if (window.location.search) {
      let search = window.location.search;
      let params = new URLSearchParams(search);
      let query = params.get("q");
      this.setState({
        searchQuery: query
      });
      if (this.state.hideCalendar === false) {
        customerOrdersService
          .getDateRangeSearch(
            this.getDateInput(this.state.startDate),
            this.getDateInput(this.state.endDate),
            this.state.pageIndex,
            10,
            query
          )
          .then(this.onGetOrdersSuccess)
          .catch(this.onGetOrdersFail);
      } else {
        customerOrdersService
          .searchAll(this.state.pageIndex, 9, query)
          .then(this.onGetOrdersSuccess)
          .catch(this.onGetOrdersFail);
      }
    } else if (this.state.hideCalendar === false) {
      customerOrdersService
        .getDateRange(
          this.getDateInput(this.state.startDate),
          this.getDateInput(this.state.endDate),
          this.state.pageIndex,
          9
        )
        .then(this.onGetOrdersSuccess)
        .catch(this.onGetOrdersFail);
    } else {
      customerOrdersService
        .selectAll(index, 9)
        .then(this.onGetOrdersSuccess)
        .catch(this.onGetOrdersFail);
    }
  };

  onGetOrdersSuccess = data => {
    const ordersList = this.mapOrdersList(data.items);
    this.setState({
      orders: data.items,
      ordersDisplay: ordersList,
      totalPages: Math.ceil(data.items[0].totalCount / 9),
      disableButton: false
    });
  };

  onGetOrdersFail = err => {
    _logger("Failed To Get Customer Order Data: " + err);

    this.setState({
      disableButton: false
    });
  };

  toggleDatePicker = () => {
    if (this.state.hideCalendar) {
      this.setState({
        hideCalendar: false
      });
    } else {
      this.setState(
        {
          hideCalendar: true,
          startDate: null,
          endDate: null
        },
        () => {
          this.displayCustomerOrders(0);
        }
      );
    }
  };

  getStatusBadge = status => {
    status = status.toLowerCase();
    if (status === "completed" || status === "refunded") {
      return "badge-info";
    } else if (status === "failed" || status === "canceled") {
      return "badge-danger";
    } else if (status === "on hold/ dispute") {
      return "badge-warning";
    } else {
      return "badge-success";
    }
  };

  mapOrdersList = data => {
    return (
      <MapCustomerOrders
        orders={data}
        handleOrderClick={this.handleOrderClick}
        getStatusBadge={this.getStatusBadge}
        convertDateCreated={this.convertDateCreated}
      />
    );
  };

  onClose = dates => {
    if (window.location.search) {
      let search = window.location.search;
      let params = new URLSearchParams(search);
      let query = params.get("q");
      customerOrdersService
        .getDateRangeSearch(
          this.getDateInput(dates.startDate),
          this.getDateInput(dates.endDate),
          0,
          9,
          query
        )
        .then(this.onGetOrdersSuccess)
        .catch(this.onGetOrdersFail);
    } else {
      customerOrdersService
        .getDateRange(
          this.getDateInput(dates.startDate),
          this.getDateInput(dates.endDate),
          0,
          9
        )
        .then(this.onGetOrdersSuccess)
        .catch(this.onGetOrdersFail);
    }
  };

  getDateInput = date => {
    var newDate = new Date(date);
    var year = newDate.getFullYear();
    var month = newDate.getMonth() + 1;
    var dt = newDate.getDate();
    if (dt < 10) {
      dt = "0" + dt;
    }
    if (month < 10) {
      month = "0" + month;
    }
    return year + "-" + month + "-" + dt;
  };

  convertDateCreated = longDate => {
    let date = new Date(longDate);
    return (
      date.getUTCMonth() +
      1 +
      "/" +
      date.getUTCDate() +
      "/" +
      date.getFullYear()
    );
  };

  handleOrderClick = clickedOrderId => {
    if (window.location.search) {
      this.props.history.push({
        pathname: "/orders/details/" + clickedOrderId,
        state: { query: this.state.searchQuery }
      });
    } else {
      this.props.history.push("/orders/details/" + clickedOrderId);
    }
  };

  handleRedoSearchClick = () => {
    this.props.history.push("/dashboard/customer");
  };

  handleFirstClick = () => {
    if (this.state.pageIndex !== 0) {
      this.setState(
        {
          pageIndex: 0,
          disableButton: true
        },
        () => {
          this.displayCustomerOrders(0);
        }
      );
    }
  };

  handleNextClick = () => {
    if (this.state.pageIndex + 1 < this.state.totalPages) {
      this.setState(
        prevState => {
          return { pageIndex: prevState.pageIndex + 1, disableButton: true };
        },
        () => {
          this.displayCustomerOrders(this.state.pageIndex);
        }
      );
    }
  };

  handlePrevClick = () => {
    if (this.state.pageIndex > 0) {
      this.setState(
        prevState => {
          return { pageIndex: prevState.pageIndex - 1, disableButton: true };
        },
        () => {
          this.displayCustomerOrders(this.state.pageIndex);
        }
      );
    }
  };

  handleLastClick = () => {
    if (this.state.pageIndex + 1 !== this.state.totalPages) {
      this.setState(
        {
          pageIndex: this.state.totalPages - 1,
          disableButton: true
        },
        () => {
          this.displayCustomerOrders(this.state.pageIndex);
        }
      );
    }
  };

  render() {
    return (
      <div className={`container ${styles.ordersListHeight}`}>
        <button
          style={{ height: "2rem" }}
          type="button"
          className="btn btn-outline-dark ml-3 mb-2"
          onClick={this.handleRedoSearchClick}
        >
          {"<<"}{" "}
          {window.location.search
            ? "Redo Search"
            : "Back to Customer Dashboard"}
        </button>
        <div className="col-lg-12 col-md-12 mb-4 mx-auto h-100">
          <div className="card h-100">
            {this.state.orders ? (
              <div className="card-body">
                <div className="no-block">
                  <h4 className="card-title pull-left mt-1 mr-2">
                    Order Summary List
                  </h4>

                  <span className="pull-right">
                    <span hidden={this.state.hideCalendar}>
                      <DateRangePicker
                        startDateId="startDate"
                        endDateId="endDate"
                        startDate={this.state.startDate}
                        endDate={this.state.endDate}
                        onDatesChange={({ startDate, endDate }) => {
                          this.setState({ startDate, endDate });
                        }}
                        focusedInput={this.state.focusedInput}
                        onFocusChange={focusedInput => {
                          this.setState({ focusedInput });
                        }}
                        onClose={({ startDate, endDate }) =>
                          this.onClose({ startDate, endDate })
                        }
                        isOutsideRange={() => false}
                        small={true}
                      />
                    </span>
                    <span onClick={this.toggleDatePicker}>
                      <i className="far fa-calendar-alt ml-1 mr-1" />
                      {this.state.hideCalendar ? (
                        <i className="fas fa-angle-down" />
                      ) : (
                        <i className="fas fa-angle-up" />
                      )}
                    </span>
                  </span>
                </div>
                <div className="table-responsive m-t-20">
                  <table className="table stylish-table">
                    <thead>
                      <tr>
                        <th>Order Date</th>
                        <th>Purchase Price</th>
                        <th>Quantity</th>
                        <th>Tracking #</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.ordersDisplay}
                      <div className={`${styles.btnBottomRight}`}>
                        <ul className="pagination">
                          <li className="paginate_button page-item first">
                            <button
                              className="page-link"
                              onClick={this.handleFirstClick}
                              disabled={this.state.disableButton}
                            >
                              {"<<"}
                            </button>
                          </li>
                          <li className="paginate_button page-item previous">
                            <button
                              className="page-link"
                              onClick={this.handlePrevClick}
                              disabled={this.state.disableButton}
                            >
                              Prev
                            </button>
                          </li>
                          <li className="paginate_button page-item active">
                            <span className="page-link">
                              {this.state.pageIndex + 1} of{" "}
                              {this.state.totalPages}
                            </span>
                          </li>
                          <li className="paginate_button page-item next">
                            <button
                              className="page-link"
                              onClick={this.handleNextClick}
                              disabled={this.state.disableButton}
                            >
                              Next
                            </button>
                          </li>
                          <li className="paginate_button page-item next">
                            <button
                              className="page-link"
                              onClick={this.handleLastClick}
                              disabled={this.state.disableButton}
                            >
                              {">>"}
                            </button>
                          </li>
                        </ul>
                      </div>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <NoResultsTable />
            )}
          </div>
        </div>
      </div>
    );
  }
}

CustomerOrders.propTypes = {
  history: PropTypes.object
};

export default CustomerOrders;
