import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb+srv://rhjtaylor_db_user:oUU1gU2YF6j89fJU@cluster0.5yyrgvd.mongodb.net/ephemera?retryWrites=true&w=majority', { serverSelectionTimeoutMS: 5000 });
  
  const User = mongoose.model('User', new mongoose.Schema({
    username: String, email: String, passwordHash: String, inviteCode: String, bio: String, createdAt: Date, followRequests: Array
  }, { strict: false }));
  
  const Notification = mongoose.model('Notification', new mongoose.Schema({
    toUserId: mongoose.Schema.Types.ObjectId,
    fromUserId: mongoose.Schema.Types.ObjectId,
    fromUsername: String,
    type: String,
    read: Boolean,
    createdAt: Date
  }, { strict: false }));

  const target = await User.findOne({ inviteCode: '9be30d27' });
  if (!target) {
    console.log('Target user not found code=9be30d27');
    process.exit(1);
  }

  // Find or create 'felix__b'
  let fake = await User.findOne({ username: 'felix__b' });
  if (!fake) {
    fake = await User.create({
      username: 'felix__b',
      email: 'felix2@local.test',
      passwordHash: 'xx',
      bio: 'test user',
      inviteCode: 'felix123',
      createdAt: new Date()
    });
  }

  // Push follow request if not exists
  const hasReq = target.followRequests?.find(r => r.userId.toString() === fake._id.toString());
  if (!hasReq) {
    await User.updateOne({ _id: target._id }, {
      $push: { followRequests: { userId: fake._id, username: fake.username, createdAt: new Date() } }
    });
    
    await Notification.create({
      toUserId: target._id,
      fromUserId: fake._id,
      fromUsername: fake.username,
      type: 'follow_request',
      read: false,
      createdAt: new Date()
    });
    console.log('Follow request from felix__b created successfully!');
  } else {
    console.log('Follow request already exists!');
  }

  process.exit(0);
}
run().catch(console.error);
