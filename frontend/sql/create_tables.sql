
/* Some Notes:
* - Some key names light up, such as name, description and I'm not sure if it is a 
* built in variable or not.
* - We can add a sequence for primary keys like this:
drop sequence if exists clients_id_seq;
CREATE SEQUENCE clients_id_seq START 1;

/*Note, you may improve by incorporating foreign key */
CREATE TABLE IF NOT EXISTS clients_with_seq (
    id int primary key default  nextval ('clients_id_seq')
    , first_name varchar(50)
    , last_name varchar(50)
    , email varchar(50)
    , password varchar(255)
    ,extension varchar(50)
    , sales_person_id int default 1
);

insert into clients_with_seq ( first_name, last_name, email, password, extension)
VALUES 
( 'client1', 'andersion','c@gmail.com', crypt('pass', gen_salt('bf')), '4178');
*/

-- Drop Tables (in reverse dependency order)
DROP TABLE IF EXISTS ShippingReport;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Overstock;
DROP TABLE IF EXISTS TransferReport;
DROP TABLE IF EXISTS Transfer;
DROP TABLE IF EXISTS [Order];
DROP TABLE IF EXISTS Boxes;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS Subscriber;
DROP TABLE IF EXISTS Subscriptions;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Stores;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Genres;
DROP TABLE IF EXISTS Country;

-- Create Tables (in dependency order)
CREATE TABLE Country (
    CountryID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    CountryName VARCHAR(30),
    Tax NUMERIC(2),
    AdditionalFees DECIMAL(3,2)
);

CREATE TABLE Genres (
    GenreID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(30),
    Description VARCHAR(150)
);

CREATE TABLE Suppliers (
    SupplierID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(30),
    StreetAddress VARCHAR(30),
    PostalCode VARCHAR(6),
    PhoneNumber NUMERIC(10),
    Email VARCHAR(30)
);


CREATE TABLE Stores (
    StoreID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    City VARCHAR(30),
    StreetAddress VARCHAR(30),
    PostalCode VARCHAR(6),
    PhoneNumber NUMERIC(10)
);

CREATE TABLE Products (
    ProductID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(30),
    Description VARCHAR(150),
    Price DECIMAL(9,2)
);

CREATE TABLE Employees (
    EmployeeID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    StoreID NUMERIC(9) FOREIGN KEY REFERENCES Stores(StoreID),
    FirstName VARCHAR(30),
    LastName VARCHAR(30),
    PhoneNumber VARCHAR(10),
    EmailAddress VARCHAR(30),
    DateJoined DATETIME,
    IsAdmin BIT,
    IsStoreOwner BIT
);

CREATE TABLE Subscriptions (
    SubscriptionID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    GenreID NUMERIC(9) FOREIGN KEY REFERENCES Genres(GenreID),
    Type VARCHAR(30),
    Price DECIMAL(9,2)
);

CREATE TABLE Subscriber (
    SubscriberID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    CountryID NUMERIC(9) FOREIGN KEY REFERENCES Country(CountryID),
    GenreID NUMERIC(9) FOREIGN KEY REFERENCES Genres(GenreID),
    SubscriptionID NUMERIC(9) FOREIGN KEY REFERENCES Subscriptions(SubscriptionID),
    FirstName VARCHAR(30),
    LastName VARCHAR(30),
    PhoneNumber VARCHAR(10),
    EmailAddress VARCHAR(30),
    ShippingAddress VARCHAR(30),
    BillingAddress VARCHAR(30),
    DateCreated DATETIME,
    PaymentType VARCHAR(30)
);

CREATE TABLE Inventory (
    InventoryID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    ProductID NUMERIC(9) FOREIGN KEY REFERENCES Products(ProductID),
    ProductName VARCHAR(30),
    Quantity NUMERIC(3)
);

CREATE TABLE Boxes (
    BoxID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    ProductID NUMERIC(9) FOREIGN KEY REFERENCES Products(ProductID),
    GenreID NUMERIC(9) FOREIGN KEY REFERENCES Genres(GenreID),
	SortingKey NUMERIC(9),
    Price DECIMAL(9,2)
);

CREATE TABLE [Order] (
    OrderID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    EmployeeID NUMERIC(9) FOREIGN KEY REFERENCES Employees(EmployeeID),
    ProductID NUMERIC(9) FOREIGN KEY REFERENCES Products(ProductID),
    SupplierID NUMERIC(9) FOREIGN KEY REFERENCES Suppliers(SupplierID),
    Quantity NUMERIC(3)
);


CREATE TABLE Transfer (
    TransferID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    SortingKey NUMERIC(9),
    ProductID NUMERIC(9) FOREIGN KEY REFERENCES Products(ProductID),
    StoreID NUMERIC(9) FOREIGN KEY REFERENCES Stores(StoreID),
    Quantity NUMERIC(3)
);

CREATE TABLE TransferReport (
    TransferReportID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    Date DATETIME,
    TransferSortingKey NUMERIC(9)
);

CREATE TABLE Overstock (
    OverstockID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    ProductID NUMERIC(9) FOREIGN KEY REFERENCES Products(ProductID),
    StoreID NUMERIC(9) FOREIGN KEY REFERENCES Stores(StoreID),
    TransferSortingKey NUMERIC(9),
    Quantity NUMERIC(3)
);

CREATE TABLE Transactions (
    TransactionID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    BoxSortingKey NUMERIC(9),
    SubscriberID NUMERIC(9) FOREIGN KEY REFERENCES Subscriber(SubscriberID),
    TotalPrice DECIMAL(9,2),
    Date DATETIME
);

CREATE TABLE ShippingReport (
    ShippingID NUMERIC(9) IDENTITY(1,1) PRIMARY KEY,
    TransactionID NUMERIC(9) FOREIGN KEY REFERENCES Transactions(TransactionID),
    SubscriberID NUMERIC(9) FOREIGN KEY REFERENCES Subscriber(SubscriberID),
    Date DATETIME,
    ShippingDuration NUMERIC(3)
);

-- Add data to table
-- need more data
--INSERT INTO Products ( product_id, p_name, p_description, price)
--VALUES 
--( 344724234, "Griff's Hair",'Griff Statue', 10.00);

-- Country

-- Genre

-- Suppliers

-- Stores

--- Tables with depedencies

