import { IApartmentOwner } from '../models/ApartmentOwner';
import { IPayment } from '../models/Payment';
import { IBuilding } from '../models/Building';
import ApartmentOwner from '../models/ApartmentOwner';
import Payment from '../models/Payment';
import Building from '../models/Building';

// Validates 'month' in 'YYYY-MM' format (e.g., 2024-01 to 2024-12)
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const resolvers = {
  DateTime: {
    __serialize(value: any) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },
    __parseValue(value: any) {
      return new Date(value);
    },
    __parseLiteral(ast: any) {
      if (ast.kind === 'StringValue') {
        return new Date(ast.value);
      }
      return null;
    }
  },
  Query: {
    // Building queries
    buildings: async (): Promise<IBuilding[]> => {
      return await Building.find().sort({ createdAt: -1 });
    },

    building: async (_: any, { id }: { id: string }): Promise<IBuilding | null> => {
      return await Building.findById(id);
    },

    buildingByName: async (_: any, { name }: { name: string }): Promise<IBuilding | null> => {
      return await Building.findOne({ name });
    },

    // Apartment Owner queries
    apartmentOwners: async (): Promise<IApartmentOwner[]> => {
      return await ApartmentOwner.find().populate('buildingId').sort({ createdAt: -1 });
    },

    apartmentOwner: async (_: any, { id }: { id: string }): Promise<IApartmentOwner | null> => {
      return await ApartmentOwner.findById(id);
    },

    apartmentOwnerByEmail: async (_: any, { email }: { email: string }): Promise<IApartmentOwner | null> => {
      return await ApartmentOwner.findOne({ email: email.toLowerCase() });
    },

    apartmentOwnerByApartmentNumber: async (_: any, { apartmentNumber }: { apartmentNumber: string }): Promise<IApartmentOwner | null> => {
      return await ApartmentOwner.findOne({ apartmentNumber }).populate('buildingId');
    },

    apartmentOwnersByBuilding: async (_: any, { buildingId }: { buildingId: string }): Promise<IApartmentOwner[]> => {
      return await ApartmentOwner.find({ buildingId }).populate('buildingId').sort({ createdAt: -1 });
    },

    // Payment queries
    payments: async (): Promise<IPayment[]> => {
      return await Payment.find().populate('apartmentOwnerId').sort({ createdAt: -1 });
    },

    payment: async (_: any, { id }: { id: string }): Promise<IPayment | null> => {
      return await Payment.findById(id).populate('apartmentOwnerId');
    },

    paymentsByApartmentOwner: async (_: any, { apartmentOwnerId }: { apartmentOwnerId: string }): Promise<IPayment[]> => {
      return await Payment.find({ apartmentOwnerId }).populate('apartmentOwnerId').sort({ month: -1 });
    },

    paymentsByMonth: async (_: any, { month }: { month: string }): Promise<IPayment[]> => {
      return await Payment.find({ month }).populate('apartmentOwnerId').sort({ createdAt: -1 });
    },

    paymentsByStatus: async (_: any, { status }: { status: string }): Promise<IPayment[]> => {
      return await Payment.find({ status }).populate('apartmentOwnerId').sort({ createdAt: -1 });
    }
  },

  Mutation: {
    // Building mutations
    createBuilding: async (_: any, { input }: { input: any }): Promise<IBuilding> => {
      const building = new Building(input);
      return await building.save();
    },

    updateBuilding: async (_: any, { id, input }: { id: string; input: any }): Promise<IBuilding | null> => {
      return await Building.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    },

    deleteBuilding: async (_: any, { id }: { id: string }): Promise<boolean> => {
      const result = await Building.findByIdAndDelete(id);
      return !!result;
    },

    // Apartment Owner mutations
    createApartmentOwner: async (_: any, { input }: { input: any }): Promise<IApartmentOwner> => {
      const apartmentOwner = new ApartmentOwner(input);
      return await apartmentOwner.save();
    },

    updateApartmentOwner: async (_: any, { id, input }: { id: string; input: any }): Promise<IApartmentOwner | null> => {
      return await ApartmentOwner.findByIdAndUpdate(id, input, { new: true, runValidators: true }).populate('buildingId');
    },

    deleteApartmentOwner: async (_: any, { id }: { id: string }): Promise<boolean> => {
      const result = await ApartmentOwner.findByIdAndDelete(id);
      return !!result;
    },


    // Payment mutations
    createPayment: async (_: any, { input }: { input: any }) => {
      const { month, ...rest } = input;

      if (!monthRegex.test(month)) {
        throw new Error('Invalid month format. Expected YYYY-MM.');
      }

      const payment = new Payment({
        ...rest,
        month,
        paymentDate: new Date(), // force current date
      });

      return await payment.save();
    },

    updatePayment: async (_: any, { id, input }: { id: string; input: any }): Promise<IPayment | null> => {
      const updatedInput = { ...input };

      // Prevent manual modification of paymentDate
      if ('paymentDate' in updatedInput) {
        delete updatedInput.paymentDate;
      }

      // Validate the month format (must be YYYY-MM)
      if ('month' in updatedInput) {
        const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!monthRegex.test(updatedInput.month)) {
          throw new Error('Invalid month format. Expected YYYY-MM.');
        }
      }

      // Perform the update with validation
      return await Payment.findByIdAndUpdate(id, updatedInput, {
        new: true, // return the updated document
        runValidators: true, // ensure Mongoose schema validation is applied
      });
    },

    deletePayment: async (_: any, { id }: { id: string }): Promise<boolean> => {
      const result = await Payment.findByIdAndDelete(id);
      return !!result;
    }
  },

  Payment: {
    apartmentOwner: async (parent: IPayment): Promise<IApartmentOwner | null> => {
      return await ApartmentOwner.findById(parent.apartmentOwnerId).populate('buildingId');
    }
  },

  ApartmentOwner: {
    building: async (parent: IApartmentOwner): Promise<IBuilding | null> => {
      if (parent.buildingId) {
        return await Building.findById(parent.buildingId);
      }
      return null;
    }
  }
}; 