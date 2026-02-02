import React from 'react';
import classes from './login.module.css';

function UsersList({ users }) {
  return (
    <div className={classes.helpText}>
      <p>Available test accounts:</p>
      <ul>
        {users.map((user, i) => (
          <li key={i}>
            Username: {user.username}, Password: {user.password}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsersList;
