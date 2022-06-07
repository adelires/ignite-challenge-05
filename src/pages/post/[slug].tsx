/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const wordCount = post.data.content.reduce((sum, item) => {
    sum += RichText.asText(item.body).split(' ').length;
    sum += item.heading ? item.heading?.split(' ').length : 0;
    return sum;
  }, 0);

  const readingTime = Math.ceil(wordCount / 200);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  function formattedDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  return (
    <>
      <Header />
      <img
        className={styles.postBanner}
        src={post.data.banner.url}
        alt={post.data.title}
      />
      <article className={commonStyles.container}>
        <h1 className={styles.postTitle}>{post.data.title}</h1>
        <ul className={styles.postInfo}>
          <li>
            <FiCalendar />
            <time>{formattedDate(post.first_publication_date)}</time>
          </li>
          <li>
            <FiUser />
            <span>{post.data.author}</span>
          </li>
          <li>
            <FiClock />
            <span>{`${readingTime} min`}</span>
          </li>
        </ul>

        {post.data.content.map(content => {
          return (
            <div key={content.heading}>
              <h2 className={styles.postHeading}>{content.heading}</h2>
              <div
                className={styles.postText}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          );
        })}
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
