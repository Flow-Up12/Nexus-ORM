import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data (order matters for FKs)
  await prisma.shipment.deleteMany()
  await prisma.orderLine.deleteMany()
  await prisma.deliveryAddress.deleteMany()
  await prisma.order.deleteMany()
  await prisma.truck.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.salesRep.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.billingAddress.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.furnitureType.deleteMany()

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        accountNumber: '1000012345',
        name: 'Alice Johnson',
      },
    }),
    prisma.customer.create({
      data: {
        accountNumber: '1000023456',
        name: 'Bob Smith',
      },
    }),
    prisma.customer.create({
      data: {
        accountNumber: '1000034567',
        name: 'Carol Williams',
      },
    }),
    prisma.customer.create({
      data: {
        accountNumber: '1000045678',
        name: 'David Brown',
      },
    }),
    prisma.customer.create({
      data: {
        accountNumber: '1000056789',
        name: 'Eva Martinez',
      },
    }),
  ])

  // Create BillingAddresses for some customers
  await prisma.billingAddress.create({
    data: {
      street: '123 Main St',
      city: 'Arlington',
      state: 'TX',
      zipCode: '76010',
      customerId: customers[0].id,
    },
  })
  await prisma.billingAddress.create({
    data: {
      street: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      customerId: customers[1].id,
    },
  })
  await prisma.billingAddress.create({
    data: {
      street: '789 Pine Rd',
      city: 'Fort Worth',
      state: 'TX',
      zipCode: '76102',
      customerId: customers[2].id,
    },
  })

  // Create Employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        ssn: '123-45-6789',
        name: 'Frank Wilson',
        address: '100 Employee Lane',
        phone: '817-555-0101',
        salary: 55000,
      },
    }),
    prisma.employee.create({
      data: {
        ssn: '234-56-7890',
        name: 'Grace Lee',
        address: '200 Worker St',
        phone: '817-555-0102',
        salary: 62000,
      },
    }),
    prisma.employee.create({
      data: {
        ssn: '345-67-8901',
        name: 'Henry Davis',
        address: '300 Staff Ave',
        phone: '817-555-0103',
        salary: 48000,
      },
    }),
  ])

  // Create Drivers (each needs an employee)
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        licenseNumber: 'DL-TX-001',
        licenseExpirationDate: new Date('2026-12-31'),
        employeeId: employees[0].id,
      },
    }),
    prisma.driver.create({
      data: {
        licenseNumber: 'DL-TX-002',
        licenseExpirationDate: new Date('2027-06-30'),
        employeeId: employees[1].id,
      },
    }),
  ])

  // Create SalesReps
  const salesReps = await Promise.all([
    prisma.salesRep.create({
      data: {
        commissionRate: 5.5,
        employeeId: employees[0].id,
      },
    }),
    prisma.salesRep.create({
      data: {
        commissionRate: 6.0,
        employeeId: employees[1].id,
      },
    }),
    prisma.salesRep.create({
      data: {
        commissionRate: 4.5,
        employeeId: employees[2].id,
      },
    }),
  ])

  // Create Trucks
  const trucks = await Promise.all([
    prisma.truck.create({
      data: {
        vehicleNumber: 'TRK-001',
        licensePlateNumber: 'ABC-1234',
        licenseExpirationDate: new Date('2026-08-15'),
        inspectionDate: new Date('2025-01-10'),
        driverId: drivers[0].id,
      },
    }),
    prisma.truck.create({
      data: {
        vehicleNumber: 'TRK-002',
        licensePlateNumber: 'DEF-5678',
        licenseExpirationDate: new Date('2026-09-20'),
        inspectionDate: new Date('2025-02-15'),
        driverId: drivers[1].id,
      },
    }),
  ])

  // Create FurnitureTypes
  const furnitureTypes = await Promise.all([
    prisma.furnitureType.create({
      data: {
        itemCode: 'SOFA-001',
        name: 'Classic Leather Sofa',
        price: 1299.99,
        quantityInStock: 15,
      },
    }),
    prisma.furnitureType.create({
      data: {
        itemCode: 'BED-001',
        name: 'Queen Size Bed Frame',
        price: 599.99,
        quantityInStock: 25,
      },
    }),
    prisma.furnitureType.create({
      data: {
        itemCode: 'DESK-001',
        name: 'Executive Desk',
        price: 899.99,
        quantityInStock: 10,
      },
    }),
    prisma.furnitureType.create({
      data: {
        itemCode: 'CHAIR-001',
        name: 'Office Chair',
        price: 349.99,
        quantityInStock: 30,
      },
    }),
    prisma.furnitureType.create({
      data: {
        itemCode: 'TABLE-001',
        name: 'Dining Table',
        price: 749.99,
        quantityInStock: 12,
      },
    }),
  ])

  // Create Orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        totalValue: 1899.98,
        deliveryFee: 49.99,
        customerId: customers[0].id,
        salesRepId: salesReps[0].id,
      },
    }),
    prisma.order.create({
      data: {
        totalValue: 1249.98,
        deliveryFee: 39.99,
        customerId: customers[1].id,
        salesRepId: salesReps[1].id,
      },
    }),
    prisma.order.create({
      data: {
        totalValue: 2649.97,
        deliveryFee: 59.99,
        customerId: customers[2].id,
        salesRepId: salesReps[0].id,
      },
    }),
    prisma.order.create({
      data: {
        totalValue: 449.99,
        deliveryFee: 29.99,
        customerId: customers[3].id,
        salesRepId: salesReps[2].id,
      },
    }),
    prisma.order.create({
      data: {
        totalValue: 3299.96,
        deliveryFee: 79.99,
        customerId: customers[4].id,
        salesRepId: salesReps[1].id,
      },
    }),
  ])

  // Create DeliveryAddresses for orders
  await prisma.deliveryAddress.create({
    data: {
      street: '123 Main St',
      city: 'Arlington',
      state: 'TX',
      zipCode: '76010',
      orderId: orders[0].id,
    },
  })
  await prisma.deliveryAddress.create({
    data: {
      street: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      orderId: orders[1].id,
    },
  })
  await prisma.deliveryAddress.create({
    data: {
      street: '321 Elm Blvd',
      city: 'Fort Worth',
      state: 'TX',
      zipCode: '76103',
      orderId: orders[2].id,
    },
  })

  // Create OrderLines
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 1299.99,
      orderId: orders[0].id,
      furnitureTypeId: furnitureTypes[0].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 349.99,
      orderId: orders[0].id,
      furnitureTypeId: furnitureTypes[3].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 599.99,
      orderId: orders[1].id,
      furnitureTypeId: furnitureTypes[1].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 2,
      unitPrice: 349.99,
      orderId: orders[1].id,
      furnitureTypeId: furnitureTypes[3].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 1299.99,
      orderId: orders[2].id,
      furnitureTypeId: furnitureTypes[0].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 749.99,
      orderId: orders[2].id,
      furnitureTypeId: furnitureTypes[4].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 599.99,
      orderId: orders[2].id,
      furnitureTypeId: furnitureTypes[1].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 449.99,
      orderId: orders[3].id,
      furnitureTypeId: furnitureTypes[3].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 1,
      unitPrice: 899.99,
      orderId: orders[4].id,
      furnitureTypeId: furnitureTypes[2].id,
    },
  })
  await prisma.orderLine.create({
    data: {
      quantity: 2,
      unitPrice: 1299.99,
      orderId: orders[4].id,
      furnitureTypeId: furnitureTypes[0].id,
    },
  })

  // Create Shipments
  await prisma.shipment.create({
    data: {
      shipmentDate: new Date('2025-02-15'),
      orderId: orders[0].id,
      truckId: trucks[0].id,
    },
  })
  await prisma.shipment.create({
    data: {
      shipmentDate: new Date('2025-02-16'),
      orderId: orders[1].id,
      truckId: trucks[1].id,
    },
  })
  await prisma.shipment.create({
    data: {
      shipmentDate: new Date('2025-02-17'),
      orderId: orders[2].id,
      truckId: trucks[0].id,
    },
  })
  await prisma.shipment.create({
    data: {
      shipmentDate: new Date('2025-02-18'),
      orderId: orders[3].id,
      truckId: trucks[1].id,
    },
  })
  await prisma.shipment.create({
    data: {
      shipmentDate: new Date('2025-02-20'),
      orderId: orders[4].id,
      truckId: trucks[0].id,
    },
  })

  console.log('Seed completed successfully!')
  console.log(`Created: ${customers.length} customers, ${employees.length} employees, ${orders.length} orders, ${furnitureTypes.length} furniture types`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
