import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState('');

  function formattedPosts(posts: array<Post>) {
    return posts.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
  }

  async function handleNextPage(): Promise<void> {
    const newPosts = await fetch(nextPage).then(res => res.json());
    setPosts([...posts, ...formattedPosts(newPosts.results)]);
    setNextPage(newPosts.next_page);
  }

  useEffect(() => {
    setPosts(formattedPosts(postsPagination.results));
    setNextPage(postsPagination.next_page);
  }, []);

  return (
    <div className={commonStyles.container}>
      <Header />
      {posts.map(post => {
        return (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <strong className={styles.postTitle}>{post.data.title}</strong>
              <p className={styles.postSubtitle}>{post.data.subtitle}</p>
              <ul className={styles.postInfo}>
                <li>
                  <FiCalendar />
                  <time className={styles.postTime}>
                    {post.first_publication_date}
                  </time>
                </li>
                <li>
                  <FiUser />
                  <span className={styles.postAuthor}>{post.data.author}</span>
                </li>
              </ul>
            </a>
          </Link>
        );
      })}

      {nextPage && (
        <button
          type="button"
          className={styles.button}
          onClick={handleNextPage}
        >
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 1 });
  const { next_page } = postsResponse;

  return {
    props: {
      postsPagination: {
        next_page,
        results: postsResponse.results,
      },
    },
  };
};
