import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Zones
  const zonesData = [
    { id: 1, name: 'Banani', lat: 23.7937, lng: 90.4066, corridor: 'North-East' },
    { id: 2, name: 'Mohakhali', lat: 23.7776, lng: 90.4054, corridor: 'North-East' },
    { id: 3, name: 'Gulshan 1', lat: 23.7808, lng: 90.4172, corridor: 'North-East' },
    { id: 4, name: 'Gulshan 2', lat: 23.7925, lng: 90.4152, corridor: 'North-East' },
    { id: 5, name: 'Baridhara', lat: 23.8016, lng: 90.4223, corridor: 'North-East' },
    { id: 6, name: 'Uttara', lat: 23.8759, lng: 90.3795, corridor: 'North' },
    { id: 7, name: 'Airport', lat: 23.8510, lng: 90.4074, corridor: 'North' },
    { id: 8, name: 'Dhanmondi', lat: 23.7461, lng: 90.3742, corridor: 'West' },
    { id: 9, name: 'Farmgate', lat: 23.7570, lng: 90.3905, corridor: 'West' },
    { id: 10, name: 'Bashundhara', lat: 23.8166, lng: 90.4348, corridor: 'East' },
  ];

  for (const zone of zonesData) {
    await prisma.zone.upsert({
      where: { id: zone.id },
      update: zone,
      create: zone,
    });
  }
  console.log('✅ Zones created');

  // 2. Zone Distances (in meters)
  const distances = [
    // Banani -> Mohakhali: 3 km (3000m)
    { fromZoneId: 1, toZoneId: 2, distanceM: 3000 },
    { fromZoneId: 2, toZoneId: 1, distanceM: 3000 },
    // Banani -> Gulshan 1: 4 km (4000m)
    { fromZoneId: 1, toZoneId: 3, distanceM: 4000 },
    { fromZoneId: 3, toZoneId: 1, distanceM: 4000 },
    // Banani -> Gulshan 2: 2.5 km (2500m)
    { fromZoneId: 1, toZoneId: 4, distanceM: 2500 },
    { fromZoneId: 4, toZoneId: 1, distanceM: 2500 },
    // Banani -> Baridhara: 3.5 km (3500m)
    { fromZoneId: 1, toZoneId: 5, distanceM: 3500 },
    { fromZoneId: 5, toZoneId: 1, distanceM: 3500 },
    // Banani -> Uttara: 10 km (10000m)
    { fromZoneId: 1, toZoneId: 6, distanceM: 10000 },
    { fromZoneId: 6, toZoneId: 1, distanceM: 10000 },
    // Mohakhali -> Gulshan 1: 2 km (2000m)
    { fromZoneId: 2, toZoneId: 3, distanceM: 2000 },
    { fromZoneId: 3, toZoneId: 2, distanceM: 2000 },
  ];

  for (const dist of distances) {
    await prisma.zoneDistance.upsert({
      where: {
        fromZoneId_toZoneId: {
          fromZoneId: dist.fromZoneId,
          toZoneId: dist.toZoneId,
        },
      },
      update: dist,
      create: dist,
    });
  }
  console.log('✅ Zone Distances created');

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 3. Driver: Jashim with Tesla "Bullet" (3 seats)
  const jashim = await prisma.user.upsert({
    where: { email: 'jashim@tesla.bd' },
    update: {},
    create: {
      name: 'Jashim Uddin',
      email: 'jashim@tesla.bd',
      phone: '+8801711000001',
      passwordHash: defaultPasswordHash,
      role: 'DRIVER',
    },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: jashim.id },
    update: {
      isOnline: true,
      currentLat: 23.7937,
      currentLng: 90.4066,
      heading: 45,
      lastLocationUpdate: new Date(),
    },
    create: {
      userId: jashim.id,
      isOnline: true,
      currentLat: 23.7937,
      currentLng: 90.4066,
      heading: 45,
      lastLocationUpdate: new Date(),
    },
  });

  await prisma.tesla.upsert({
    where: { driverId: driver.userId },
    update: { capacity: 3 },
    create: {
      driverId: driver.userId,
      name: 'Bullet',
      plateNo: 'DHA-GA-11-2233',
      capacity: 3,
    },
  });
  console.log('✅ Driver Jashim and Tesla Bullet (3 seats) created');

  // 4. Passengers: Nusrat, Rafiq, Shirin
  const passengers = [
    { name: 'Nusrat Jahan', email: 'nusrat@example.com', phone: '+8801811000002', balance: 50000 },
    { name: 'Rafiq Ahmed', email: 'rafiq@example.com', phone: '+8801911000003', balance: 50000 },
    { name: 'Shirin Akter', email: 'shirin@example.com', phone: '+8801611000004', balance: 50000 },
  ];

  for (const p of passengers) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash: defaultPasswordHash,
        role: 'PASSENGER',
      },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balancePaisa: p.balance },
      create: {
        userId: user.id,
        balancePaisa: p.balance,
      },
    });
  }
  console.log('✅ Passengers Nusrat, Rafiq, Shirin and wallets created');
  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
