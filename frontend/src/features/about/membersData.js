// Import ảnh (bạn để ảnh trong src/assets/ hoặc public/ rồi import)
// Ví dụ tôi giả sử có ảnh trong src/assets/images/
import avatar1 from './image/NguyenHoangLong.jpg';
import avatar2 from './image/NguyenDuongNhu.jpg';
// import avatar3 from '../../assets/images/member3.jpg';

export const members = [
  {
    id: 1,
    name: 'Nguyễn Hoàng Long',
    title: 'Fullstack Developer',
    email: 'a.nguyen@example.com',
    facebook: 'https://facebook.com/userA',
    instagram: 'https://instagram.com/userA',
    avatar: avatar1,
  },
  {
    id: 2,
    name: 'Nguyễn Như',
    title: 'Domain Specialist',
    email: 'b.tran@example.com',
    facebook: 'https://facebook.com/userB',
    instagram: 'https://instagram.com/userB',
    avatar: avatar2,
  },
//   {
//     id: 3,
//     name: 'Lê Văn C',
//     title: 'Mobile Developer',
//     email: 'c.le@example.com',
//     facebook: 'https://facebook.com/userC',
//     instagram: 'https://instagram.com/userC',
//     avatar: avatar3,
//   },
];