import mongoose from 'mongoose';
import ApartmentOwner from '../models/ApartmentOwner';
import Payment from '../models/Payment';

async function testModels() {
  try {
    await mongoose.connect('mongodb://localhost:27017/condominium-test');

    const owner = new ApartmentOwner({
      name: 'Test Owner',
      email: 'test@example.com',
      apartmentNumber: 'A101',
      phoneNumber: '+1234567890'
    });

    const savedOwner = await owner.save();
    console.log('✅ Apartment owner created:', savedOwner.name);

    const paymentsToTest = [
      {
        label: '✅ paymentDate omitted (should default to now)',
        input: {
          apartmentOwnerId: savedOwner._id,
          amount: 500,
          month: '2024-08',
          description: 'Omitted paymentDate'
        }
      },
      {
        label: '✅ paymentDate is undefined (should default to now)',
        input: {
          apartmentOwnerId: savedOwner._id,
          amount: 500,
          month: '2024-08',
          description: 'Undefined paymentDate',
          paymentDate: undefined
        }
      },
      {
        label: '❌ paymentDate is null (should be ignored, month invalid)',
        input: {
          apartmentOwnerId: savedOwner._id,
          amount: 500,
          month: '',
          description: 'Null paymentDate',
          paymentDate: null
        }
      },
      {
        label: '❌ month with invalid format (08-2024)',
        input: {
          apartmentOwnerId: savedOwner._id,
          amount: 500,
          month: '08-2024',
          description: 'Invalid month format'
        }
      },
      {
        label: '❌ month with invalid format (2024/08)',
        input: {
          apartmentOwnerId: savedOwner._id,
          amount: 500,
          month: '2024/08',
          description: 'Invalid month format slash'
        }
      },
      {
        label: '✅ valid month (2025-01)',
        input: {
          apartmentOwnerId: savedOwner._id,
          amount: 500,
          month: '2025-01',
          description: 'Valid month'
        }
      },
    ];

    for (const { label, input } of paymentsToTest) {
      try {
        const payment = new Payment(input);
        const saved = await payment.save();
        console.log(`✅ ${label}`);
        console.log('→ paymentDate:', saved.paymentDate);
        console.log('→ month:', saved.month);
      } catch (err: any) {
        console.error(`❌ ${label}`);
        if (err?.message) {
          console.error('⛔', err.message);
        } else {
          console.error(err);
        }
      }
    }

    // Cleanup
    await ApartmentOwner.findByIdAndDelete(savedOwner._id);
    await Payment.deleteMany({ description: { $regex: 'paymentDate|month' } });
    await mongoose.disconnect();

    console.log('🧪 Test complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

testModels();
