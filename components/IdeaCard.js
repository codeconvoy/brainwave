import Modal from './Modal';
import Loading from './Loading';
import Router from 'next/router';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import {
  getFirestore, doc, deleteDoc, updateDoc, arrayUnion,
  collection, query, where, limit, getDocs
} from 'firebase/firestore';
import { useState } from 'react';

import styles from '../styles/components/IdeaCard.module.css';

export default function IdeaCard(props) {
  const { id, title, members, creator } = props;

  const db = getFirestore();
  const auth = getAuth();
  const uid = auth.currentUser.uid;

  const ideaDoc = doc(db, 'ideas', id);

  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [username, setUsername] = useState('');
  const [foundUsers, setFoundUsers] = useState(null);

  // updates idea in firebase
  async function updateIdea() {
    await updateDoc(ideaDoc, {
      title: newTitle
    });
  }

  // deletes idea from firebase
  async function deleteIdea() {
    if (!window.confirm('Delete idea?')) return;
    await deleteDoc(ideaDoc);
  }

  // adds given user to idea
  async function addMember(mUid) {
    await updateDoc(ideaDoc, {
      members: arrayUnion(mUid)
    });
  }

  // removes given user from idea
  async function removeMember(mUid) {
    if (!window.confirm(`Remove ${mUid} from ${title}?`)) return;
    await updateDoc(ideaDoc, {
      members: arrayRemove(mUid)
    });
  }

    setFoundUsers(undefined);
    const usersRef = collection(db, 'users');
    const usersQuery = query(
      usersRef,
      where('usernameLower', '>=', username.toLowerCase()),
      where('usernameLower', '<', `${username.toLowerCase()}~`),
      limit(10)
    );
    const users = await getDocs(usersQuery);
    setFoundUsers(users.docs.map(doc => doc.data()));
  }

  // resets modal
  function resetModal() {
    setFoundUsers(null);
    setNewTitle(title);
    setUsername('');
  }

  return (
    <>
      <Card
        className={styles.container}
        onClick={() => Router.push(`ideas/${id}`)}
      >
        <CardContent>
          <button
            className={styles.editbutton}
            onClick={e => {
              e.stopPropagation();
              resetModal();
              setModalOpen(true);
            }}
          >
            <EditIcon />
          </button>
          <p>{title}</p>
        </CardContent>
      </Card>
      <Modal open={modalOpen} setOpen={setModalOpen}>
        <h1>Editing {title}</h1>
        <form onSubmit={e => {
          e.preventDefault();
          updateIdea();
        }}>
          <div className="input-button">
            <input
              placeholder="title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            <button>
              <AddIcon />
            </button>
          </div>
        </form>
        {
          members.map(mUid =>
            <div key={mUid}>
              {
                mUid !== creator &&
                <button onClick={() => removeMember(mUid)}>
                  <DeleteIcon />
                </button>
              }
              <span>{mUid}</span>
            </div>
          )
        }
        <form onSubmit={e => {
          e.preventDefault();
          searchMembers();
        }}>
          <div className="input-button">
            <input
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <button>
              <SearchIcon />
            </button>
          </div>
        </form>
        {
          foundUsers === undefined ?
          <Loading /> :
          foundUsers &&
          (
            foundUsers.length ?
            foundUsers.map(user =>
              <div key={user.uid}>
                {
                  !members.includes(user.uid) &&
                  <button onClick={() => addMember(user.uid)}>
                    <AddIcon />
                  </button>
                }
                <span>{user.username}</span>
              </div>
            ) :
            <div>No users found</div>
          )
        }
        <button onClick={deleteIdea}>
          <DeleteIcon />
        </button>
      </Modal>
    </>
  );
}
