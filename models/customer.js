"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /**returns full name of the customer */
  fullName() {
    return this.firstName + " " + this.lastName;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get a list of customers by name. */

  static async search(name) {
    const results = await db.query(
      `SELECT id,
               first_name AS "firstName",
               last_name  AS "lastName",
               phone,
               notes
           FROM customers
           WHERE first_name ILIKE $1 OR last_name ILIKE $1 `,
      ["%" + name + "%"]
    );
    const customers = results.rows;
    if (customers[0] === undefined) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }
    return customers.map((c) => new Customer(c));
  }


  /**returns a list of the top ten customerIds based on number of reservations */
  static async getTopTenCustomers() {
    const results = await db.query(
      `SELECT customer_id AS "customerId", COUNT(*)
           FROM reservations
           GROUP BY customer_id
           ORDER BY COUNT(*) DESC LIMIT 10`
    );

    const customerIds = results.rows.map((row) => row.customerId);
    debugger;
    const customersPromises = customerIds.map(async (id) => await Customer.get(id));

    const customers = await Promise.all(customersPromises);
    return customers;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
