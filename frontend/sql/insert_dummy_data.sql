--Country
INSERT INTO Country (CountryName, Tax, AdditionalFees) VALUES
('Canada', 15.00, 5.99),
('USA', 10.00, 0.00),
('UK', 20.00, 12.99),
('Germany', 19.00, 15.99),
('Australia', 10.00, 21.50);
--Genres
INSERT INTO Genres (Name, Description) VALUES
('Fantasy', 'Fantasy genre description'),
('Science Fiction', 'Sci-fi genre description'),
('Mystery', 'Mystery genre description'),
('Horror', 'Horror genre description'),
('Adventure', 'Adventure genre description');
--Suppliers
INSERT INTO Suppliers (Name, StreetAddress, PostalCode, PhoneNumber, Email) VALUES
('Supplier One', '123 Street', 'M4B1B3', '4161234567', 'supplier1@example.com'),
('Supplier Two', '234 Avenue', 'M4B1B4', '4161234568', 'supplier2@example.com'),
('Supplier Three', '345 Blvd', 'M4B1B5', '4161234569', 'supplier3@example.com'),
('Supplier Four', '456 Lane', 'M4B1B6', '4161234570', 'supplier4@example.com'),
('Supplier Five', '567 Road', 'M4B1B7', '4161234571', 'supplier5@example.com');
--Stores
INSERT INTO Stores (City, StreetAddress, PostalCode, PhoneNumber) VALUES
('Toronto', '456 Queen St', 'M5V2B6', '4165551234'),
('Vancouver', '789 Granville St', 'V6Z1E4', '6045555678'),
('Montreal', '321 St Catherine St', 'H3B1A1', '5145558765'),
('Calgary', '654 17 Ave SW', 'T2S0B5', '4035554321'),
('Ottawa', '987 Bank St', 'K1S3W7', '6135559876');
--Products
INSERT INTO Products (Name, Description, Price) VALUES
('Magic Wand', 'A wand with magical properties', 29.99),
('Laser Sword', 'A futuristic sword with laser blades', 99.99),
('Mystery Box', 'A surprise box with unknown items', 19.99),
('VR Headset', 'Virtual reality headset for gaming', 199.99),
('Gaming Mouse', 'Ergonomic gaming mouse with RGB', 49.99);
--Employees
INSERT INTO Employees (StoreID, Password, FirstName, LastName, PhoneNumber, EmailAddress, DateJoined, IsAdmin, IsStoreOwner) VALUES
( 1, 'admin123', 'Alice', 'Johnson', '4165551111', 'alice@example.com', '2023-01-15', 1, 0),
( 2, 'storeboss', 'Bob', 'Smith', '6045552222', 'bob@example.com', '2022-12-10', 0, 1),
( 3, 'charliepw', 'Charlie', 'Brown', '5145553333', 'charlie@example.com', '2021-11-05', 0, 0),
( 4, 'daisypass', 'Daisy', 'Williams', '4035554444', 'daisy@example.com', '2024-03-25', 1, 1),
( 5, 'etaylorpw', 'Ethan', 'Taylor', '6135555555', 'ethan@example.com', '2020-07-20', 0, 0);

--SubscriptionTypes
INSERT INTO SubscriptionTypes (GenreID, Type, Price) VALUES
(1, 'Monthly', 15.99),  -- Fantasy
(1, 'Annual', 149.99),
(2, 'Monthly', 15.99),  -- Science Fiction
(2, 'Annual', 149.99),
(3, 'Monthly', 15.99),  -- Mystery
(3, 'Annual', 149.99),
(4, 'Monthly', 15.99),  -- Horror
(4, 'Annual', 149.99),
(5, 'Monthly', 15.99),  -- Adventure
(5, 'Annual', 149.99);
--Subscriptions
INSERT INTO Subscriptions (SubscriptionTypeID, SubscriptionStartDate) VALUES
(1, '2024-01-01'),
(2, '2024-01-01'),
(3, '2024-01-01'),
(4, '2024-01-01'),
(5, '2024-01-01');
--Subscriber
INSERT INTO Subscriber (Username, Password, CountryID, GenreID, SubscriptionID, FirstName, LastName, PhoneNumber, EmailAddress, ShippingAddress, BillingAddress, DateCreated, PaymentType, SubscriptionStartDate) VALUES
('johndoe', 'password123', 1, 1, 1, 'John', 'Doe', '4165559999', 'john.doe@example.com', '123 Maple St, Toronto', '456 Oak St, Toronto', '2024-01-01', 'Credit Card', '2024-01-01'),
('sconnor', 'terminator', 2, 2, 2, 'Sarah', 'Connor', '6045558888', 'sarah.connor@example.com', '789 Pine St, Vancouver', '101 Birch St, Vancouver', '2024-03-20', 'PayPal', '2024-03-20'),
('rgrimes', 'coral123', 3, 3, 3, 'Rick', 'Grimes', '5145557777', 'rick.grimes@example.com', '102 Cedar St, Montreal', '204 Elm St, Montreal', '2023-11-20', 'Debit Card', '2023-11-20'),
('wwhite', 'heisenberg', 4, 4, 4, 'Walter', 'White', '4035556666', 'walter.white@example.com', '303 Aspen St, Calgary', '405 Spruce St, Calgary', '2023-10-10', 'Bank Transfer', '2023-10-10'),
('dprince', 'amazon123', 5, 5, 5, 'Diana', 'Prince', '6135555555', 'diana.prince@example.com', '506 Chestnut St, Ottawa', '608 Willow St, Ottawa', '2023-09-05', 'Gift Card', '2023-09-05');
--Inventory
INSERT INTO Inventory (ProductID, ProductName, Quantity) VALUES
(1, 'Magic Wand', 100),
(2, 'Laser Sword', 50),
(3, 'Mystery Box', 75),
(4, 'VR Headset', 30),
(5, 'Gaming Mouse', 120);
--Boxes
INSERT INTO Boxes (ProductID, GenreID, SortingKey, Price) VALUES
(1, 1, 101, 49.99),
(2, 2, 102, 79.99),
(3, 3, 103, 39.99),
(4, 4, 104, 99.99),
(5, 5, 105, 29.99);
--Order
INSERT INTO [Order] (EmployeeID, ProductID, SupplierID, Quantity) VALUES
(1, 1, 1, 20),
(2, 2, 2, 15),
(3, 3, 3, 25),
(4, 4, 4, 10),
(5, 5, 5, 30);
--Transfer
INSERT INTO Transfer (SortingKey, ProductID, StoreID, Quantity) VALUES
(201, 1, 1, 10),
(202, 2, 2, 20),
(203, 3, 3, 15),
(204, 4, 4, 5),
(205, 5, 5, 25);
--TransferReport
INSERT INTO TransferReport (Date, TransferSortingKey) VALUES
('2024-03-01', 201),
('2024-03-02', 202),
('2024-03-03', 203),
('2024-03-04', 204),
('2024-03-05', 205);
--Overstock
INSERT INTO Overstock (ProductID, StoreID, TransferSortingKey, Quantity) VALUES
(1, 1, 201, 5),
(2, 2, 202, 10),
(3, 3, 203, 7),
(4, 4, 204, 3),
(5, 5, 205, 12);
--Transactions
INSERT INTO Transactions (BoxSortingKey, SubscriberID, TotalPrice, Date) VALUES
(101, 1, 49.99, '2024-03-06'),
(102, 2, 79.99, '2024-03-07'),
(103, 3, 39.99, '2024-03-08'),
(104, 4, 99.99, '2024-03-09'),
(105, 5, 29.99, '2024-03-10'),
(101, 1, 49.99, DATEADD(month, -3, GETDATE())),
(102, 2, 79.99, DATEADD(month, -2, GETDATE())),
(103, 3, 39.99, DATEADD(month, -1, GETDATE())),
(104, 1, 59.99, DATEADD(month, -5, GETDATE())),
(105, 2, 89.99, DATEADD(month, -4, GETDATE()));
--ShippingReport
INSERT INTO ShippingReport (TransactionID, SubscriberID, Date, ShippingDuration) VALUES
(1, 1, '2024-03-07', 3),
(2, 2, '2024-03-08', 5),
(3, 3, '2025-02-09', 4),
(4, 4, '2025-03-10', 2),
(5, 5, '2024-03-11', 6);

