import {checkUser} from "@/lib/checkUser";
export default function About() {
  const userId = checkUser();
  return (
    <div>
      <h1>About</h1>
      <p>UserId: {userId}</p>
    </div>
  )
}