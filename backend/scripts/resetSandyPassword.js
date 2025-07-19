const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    const username = 'sandy';
    const newPassword = 'Sandy@123';
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('User not found:', username);
      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    console.log('Password updated successfully for user:', username);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await sequelize.close();
  }
}

resetPassword(); 