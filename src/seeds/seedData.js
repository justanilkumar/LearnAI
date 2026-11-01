const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Review = require('../models/Review');

const seedDatabase = async ({ silent = false } = {}) => {
  try {
    if (!silent) console.log('🌱 Starting Learnify LMS database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Lesson.deleteMany({}),
      Quiz.deleteMany({}),
      Enrollment.deleteMany({}),
      Certificate.deleteMany({}),
      Review.deleteMany({})
    ]);

    // 1. Create Users
    const password = 'Password123!';

    const [instructorSarah, instructorDavid, studentAlex, studentPriya, adminUser] = await Promise.all([
      User.create({
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@learnify.io',
        password,
        role: 'instructor',
        headline: 'Principal Backend Architect & MongoDB Fellow',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        bio: 'Over 12 years of designing resilient distributed database architectures and high-throughput systems.'
      }),
      User.create({
        name: 'David Miller',
        email: 'david.miller@learnify.io',
        password,
        role: 'instructor',
        headline: 'Full-Stack Lead & Cloud DevOps Specialist',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        bio: 'Passionate about modern backend engineering, Docker containerization, and enterprise system designs.'
      }),
      User.create({
        name: 'Alex Morgan',
        email: 'alex.morgan@student.io',
        password,
        role: 'student',
        headline: 'Aspiring Fullstack Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        bio: 'Learning full-stack development, algorithms, and system design for technical interviews.'
      }),
      User.create({
        name: 'Priya Sharma',
        email: 'priya.sharma@student.io',
        password,
        role: 'student',
        headline: 'Computer Science Graduate & Software Developer',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        bio: 'Passionate backend developer focused on database optimization and microservices.'
      }),
      User.create({
        name: 'System Admin',
        email: 'admin@learnify.io',
        password,
        role: 'admin',
        headline: 'Learnify Platform Administrator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        bio: 'Manages platform courses, user moderation, and enterprise deployments.'
      })
    ]);

    // 2. Create Courses
    const course1 = await Course.create({
      title: 'Production-Ready MongoDB & Mongoose Architecture',
      subtitle: 'Master schema design, compound indexing, aggregation pipelines, and transaction safety in production.',
      description: 'Comprehensive deep dive into building scalable enterprise backends with MongoDB and Mongoose. Learn the 1:1, 1:N, and N:M data modeling patterns, indexing strategies to optimize query execution plans, aggregation pipelines ($lookup, $unwind, $facet, $group), and replica set transaction atomicity.',
      category: 'Database & Backend',
      level: 'Intermediate',
      price: 49.99,
      durationHours: 12,
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
      instructor: instructorSarah._id,
      tags: ['MongoDB', 'Mongoose', 'Database Design', 'Node.js', 'Aggregations', 'Indexes']
    });

    const course2 = await Course.create({
      title: 'Building Scalable RESTful Microservices with Node.js',
      subtitle: 'Architect production-grade APIs with JWT auth, rate limiting, and caching.',
      description: 'Step-by-step masterclass on structuring real-world Node.js and Express REST APIs. Covers layered architecture (Controller-Service-Repository), input validation, custom error handling, JWT-based RBAC authorization, and Redis caching layers.',
      category: 'Web Development',
      level: 'Advanced',
      price: 59.99,
      durationHours: 16,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      instructor: instructorSarah._id,
      tags: ['Node.js', 'Express', 'REST API', 'JWT', 'Security', 'Microservices']
    });

    const course3 = await Course.create({
      title: 'System Design & High-Concurrency Data Modeling',
      subtitle: 'Prepare for top-tier technical interviews with real-world system architecture breakdowns.',
      description: 'Master the principles of designing high-scale distributed systems. Understand sharding, replication topologies, CAP theorem trade-offs, message queues (Kafka/RabbitMQ), and consistent hashing.',
      category: 'System Design',
      level: 'Advanced',
      price: 79.99,
      durationHours: 18,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      instructor: instructorDavid._id,
      tags: ['System Design', 'Scalability', 'Distributed Systems', 'Architecture', 'Interview Prep']
    });

    const course4 = await Course.create({
      title: 'Docker & Kubernetes for Modern Backend Developers',
      subtitle: 'Zero to hero containerization, Docker Compose setups, and cloud deployments.',
      description: 'Hands-on guide to containerizing Node.js and MongoDB applications with multi-stage Dockerfiles, managing multi-container dev environments with Docker Compose, and deploying to cloud Kubernetes clusters.',
      category: 'DevOps & Cloud',
      level: 'Beginner',
      price: 0, // Free course
      durationHours: 8,
      thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80',
      instructor: instructorDavid._id,
      tags: ['Docker', 'Kubernetes', 'DevOps', 'Containers', 'CI/CD']
    });

    // 3. Create Lessons for Course 1
    const [c1l1, c1l2, c1l3, c1l4] = await Promise.all([
      Lesson.create({
        course: course1._id,
        moduleTitle: 'Module 1: Mongoose Schema & Modeling Foundations',
        title: '1.1 Schema Constraints, Validation & Virtuals',
        description: 'Understand schema options, custom validators, getters, setters, and virtual population fields.',
        durationMinutes: 25,
        order: 1,
        isFreePreview: true,
        videoUrl: 'https://www.youtube-nocookie.com/embed/WDrU305J1yw',
        content: `### Schema Definition & Virtuals in Mongoose
In this lesson, we explore how Mongoose schemas bridge JavaScript objects and MongoDB BSON documents.

#### Key Highlights:
- **Custom Validators**: Writing async regex and custom logic validators.
- **Virtual Properties**: Adding computed fields that do not consume database disk space.
- **Pre & Post Hooks (Middleware)**: Intercepting \`save\`, \`validate\`, and \`find\` operations.
\`\`\`javascript
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String
});

userSchema.virtual('fullName').get(function() {
  return \`\${this.firstName} \${this.lastName}\`;
});
\`\`\`
`
      }),
      Lesson.create({
        course: course1._id,
        moduleTitle: 'Module 1: Mongoose Schema & Modeling Foundations',
        title: '1.2 Indexing Strategies: Single Field, Compound & Text Indexes',
        description: 'Deep dive into MongoDB B-Tree indexes, query execution explain plans, and index selectivity.',
        durationMinutes: 35,
        order: 2,
        isFreePreview: false,
        videoUrl: 'https://www.youtube-nocookie.com/embed/ofme2o29ngU',
        content: `### Compound Indexes & ESR Rule
Learn how to apply the Equality, Sort, Range (ESR) rule when designing compound indexes for ultra-fast query execution.

\`\`\`javascript
// Compound index on category (Equality) and createdAt (Sort)
courseSchema.index({ category: 1, createdAt: -1 });
\`\`\`
`
      }),
      Lesson.create({
        course: course1._id,
        moduleTitle: 'Module 2: Aggregation Pipeline Mastery',
        title: '2.1 Mastering $match, $group, $lookup and $unwind',
        description: 'Constructing performant multi-stage aggregation pipelines for complex analytics and reporting.',
        durationMinutes: 40,
        order: 3,
        isFreePreview: false,
        videoUrl: 'https://www.youtube-nocookie.com/embed/Kk6Er0c7srU',
        content: `### Deep Dive: Multi-Stage Pipelines
Aggregation pipelines process documents sequentially through stages:
1. **$match**: Filters documents early to leverage indexes.
2. **$lookup**: Performs left outer joins with related collections.
3. **$unwind**: Deconstructs an array field from the input documents.
4. **$group**: Groups documents by a specified identifier expression and computes accumulators.
`
      }),
      Lesson.create({
        course: course1._id,
        moduleTitle: 'Module 2: Aggregation Pipeline Mastery',
        title: '2.2 Multi-Faceted Aggregations & Pagination with $facet',
        description: 'Executing multiple analytics pipelines simultaneously over the same input document set.',
        durationMinutes: 30,
        order: 4,
        isFreePreview: false,
        videoUrl: 'https://www.youtube-nocookie.com/embed/vx1C8eyZ-mU',
        content: `### $facet Stage for Infinite Scroll & Faceted Search
$facet allows you to compute metadata (total counts, category breakdown) and paginated records in a single round-trip database query!
`
      })
    ]);

    // Create Lessons for Course 2
    await Promise.all([
      Lesson.create({
        course: course2._id,
        moduleTitle: 'Module 1: REST Architecture & Setup',
        title: '1.1 Layered Architecture in Express',
        description: 'Structuring Controllers, Services, and Models for maintainability.',
        durationMinutes: 20,
        order: 1,
        isFreePreview: true,
        content: 'Learn how to keep controllers thin and encapsulate business logic.'
      }),
      Lesson.create({
        course: course2._id,
        moduleTitle: 'Module 1: REST Architecture & Setup',
        title: '1.2 JWT Authentication & Role-Based Access Control',
        description: 'Implementing token issuance, verification, and role guard middlewares.',
        durationMinutes: 30,
        order: 2,
        isFreePreview: false,
        content: 'Building secure stateless authentication with JSON Web Tokens.'
      })
    ]);

    // Create Lessons for Course 3
    await Promise.all([
      Lesson.create({
        course: course3._id,
        moduleTitle: 'Module 1: High-Concurrency Principles',
        title: '1.1 CAP Theorem & Distributed Consistency Models',
        description: 'Trade-offs between consistency, availability, and network partitioning in distributed databases.',
        durationMinutes: 35,
        order: 1,
        isFreePreview: true,
        content: 'Explore CP vs AP databases and eventual consistency patterns.'
      }),
      Lesson.create({
        course: course3._id,
        moduleTitle: 'Module 1: High-Concurrency Principles',
        title: '1.2 Consistent Hashing & Distributed Caching',
        description: 'Designing resilient distributed caching rings with minimal key churn.',
        durationMinutes: 40,
        order: 2,
        isFreePreview: false,
        content: 'Understanding virtual nodes and hash rings for scalable cache tiers.'
      })
    ]);

    // Create Lessons for Course 4
    await Promise.all([
      Lesson.create({
        course: course4._id,
        moduleTitle: 'Module 1: Docker Basics',
        title: '1.1 Dockerizing a Node.js & MongoDB App',
        description: 'Writing optimal multi-stage Dockerfiles and utilizing .dockerignore.',
        durationMinutes: 25,
        order: 1,
        isFreePreview: true,
        content: 'Learn the fundamentals of Docker containers and images.'
      }),
      Lesson.create({
        course: course4._id,
        moduleTitle: 'Module 1: Docker Basics',
        title: '1.2 Multi-Container Orchestration with Docker Compose',
        description: 'Connecting web services and MongoDB database with persistent volumes.',
        durationMinutes: 30,
        order: 2,
        isFreePreview: false,
        content: 'Managing local development services with docker-compose.yml.'
      })
    ]);

    // 4. Create Comprehensive Quizzes for ALL Courses
    // Quiz for Course 1
    const quiz1 = await Quiz.create({
      course: course1._id,
      title: 'MongoDB & Mongoose Production Assessment',
      description: 'Test your knowledge on schema design, compound indexing, and aggregation pipelines.',
      passingScorePercentage: 75,
      questions: [
        {
          question: 'What is the primary benefit of applying the ESR (Equality, Sort, Range) rule to compound indexes?',
          options: [
            'It reduces RAM usage of the database cache',
            'It allows MongoDB to locate equality matches first, satisfy sorting in-index without in-memory sort, and then scan the range',
            'It automatically shunts documents across different shards',
            'It enables full-text search across arbitrary string fields'
          ],
          correctOptionIndex: 1,
          explanation: 'The ESR rule ensures that the index handles equality filters first, orders the candidate keys to avoid in-memory sorting (SORT stage), and then evaluates range filters.'
        },
        {
          question: 'Which Mongoose feature allows defining document properties that can be retrieved but are NOT persisted to the MongoDB disk?',
          options: [
            'Pre-save Hooks',
            'Virtual Properties (Virtuals)',
            'Compound Indexes',
            'Discriminators'
          ],
          correctOptionIndex: 1,
          explanation: 'Virtuals are document properties that you can get and set but that do not get stored in the MongoDB database collection.'
        },
        {
          question: 'In a MongoDB aggregation pipeline, which stage should generally be placed as early as possible to maximize index usage?',
          options: [
            '$group',
            '$unwind',
            '$match',
            '$lookup'
          ],
          correctOptionIndex: 2,
          explanation: 'Placing $match at the very beginning of the pipeline allows MongoDB to take full advantage of existing indexes to quickly filter candidate documents.'
        },
        {
          question: 'What happens when two concurrent operations attempt to insert documents with the same key into a field with a unique index?',
          options: [
            'The second operation silently overwrites the first document',
            'MongoDB throws duplicate key error code 11000 to reject the second operation',
            'The second document is stored in a special quarantine collection',
            'MongoDB converts the field to an array of values'
          ],
          correctOptionIndex: 1,
          explanation: 'MongoDB enforces unique indexes by throwing error code 11000 (E11000 duplicate key error) when a duplicate value is attempted.'
        }
      ]
    });

    // Quiz for Course 2
    const quiz2 = await Quiz.create({
      course: course2._id,
      title: 'RESTful Microservices & Express Architecture Assessment',
      description: 'Test your expertise on JWT authentication, middleware pipelines, error handling, and security.',
      passingScorePercentage: 75,
      questions: [
        {
          question: 'What is the primary advantage of stateless JWT authentication over server-side session stores in microservices?',
          options: [
            'Tokens are encrypted with AES-256 and cannot be decoded by anyone',
            'Any microservice can independently verify the token signature using the shared secret/public key without querying a centralized session DB',
            'JWT tokens automatically refresh themselves every 15 minutes without client intervention',
            'JWT eliminates the need for SSL/TLS HTTPS encryption'
          ],
          correctOptionIndex: 1,
          explanation: 'Because JWTs are self-contained and digitally signed, individual microservice instances can verify the token signature independently without making network calls to a shared session database.'
        },
        {
          question: 'In Express.js middleware chaining, what happens if an error occurs and is passed to next(err)?',
          options: [
            'Express crashes and the Node.js process terminates immediately',
            'Express skips remaining non-error middlewares and routes execution to the designated error-handling middleware (err, req, res, next)',
            'Express automatically retries the HTTP request up to 3 times',
            'The error message is logged to stdout and the client receives a 200 OK'
          ],
          correctOptionIndex: 1,
          explanation: 'When an argument is passed to next(err), Express recognizes it as an error and routes execution directly to custom error handlers defined with 4 arguments: (err, req, res, next).'
        },
        {
          question: 'Which HTTP status code should a RESTful API return when a client makes a syntactically invalid request (e.g. missing required JSON fields)?',
          options: [
            '401 Unauthorized',
            '403 Forbidden',
            '400 Bad Request',
            '404 Not Found'
          ],
          correctOptionIndex: 2,
          explanation: 'HTTP 400 Bad Request indicates that the server cannot process the request due to client errors (e.g. malformed syntax, missing mandatory attributes).'
        },
        {
          question: 'How does a reverse proxy like NGINX protect backend Node.js microservices?',
          options: [
            'By compiling JavaScript into machine bytecode ahead of time',
            'By providing SSL termination, request buffering, rate limiting, and load balancing across worker instances',
            'By converting all SQL queries into NoSQL MongoDB documents',
            'By eliminating the need for operating system firewalls'
          ],
          correctOptionIndex: 1,
          explanation: 'Reverse proxies offload SSL/TLS negotiation, buffer slow clients to prevent event-loop exhaustion, and distribute traffic across multiple Node.js processes.'
        }
      ]
    });

    // Quiz for Course 3
    const quiz3 = await Quiz.create({
      course: course3._id,
      title: 'System Design & High-Concurrency Data Modeling Assessment',
      description: 'Test your understanding of distributed architectures, consistent hashing, caching, and the CAP theorem.',
      passingScorePercentage: 75,
      questions: [
        {
          question: 'According to the CAP Theorem, when a network partition occurs in a distributed system, what trade-off must be made?',
          options: [
            'You must choose between Performance and Durability',
            'You must choose between Consistency (all nodes see the same data) and Availability (every non-failing node returns a response)',
            'You must switch from TCP to UDP protocols',
            'You must convert the database to an in-memory cache'
          ],
          correctOptionIndex: 1,
          explanation: 'The CAP theorem states that in the presence of a network partition (P), a distributed system must sacrifice either Consistency (C) or Availability (A).'
        },
        {
          question: 'What is the primary benefit of Consistent Hashing over naive modulo hashing (hash(key) % N) in distributed caching systems?',
          options: [
            'It encrypts the cached keys using cryptographic salts',
            'When a node is added or removed, only K/N keys need to be remapped on average rather than all keys',
            'It guarantees zero cache misses under all conditions',
            'It compresses data by 90% before storing'
          ],
          correctOptionIndex: 1,
          explanation: 'Consistent hashing minimizes key redistribution upon cluster resizing: only K/N keys need to be migrated when a server joins or leaves the ring.'
        },
        {
          question: 'What is the main purpose of the Circuit Breaker pattern in microservice architectures?',
          options: [
            'To prevent a failing downstream service from causing cascading failures across the entire system by failing fast',
            'To encrypt network packets between Docker containers',
            'To automatically rebalance database sharding chunks',
            'To enforce role-based access control on HTTP routes'
          ],
          correctOptionIndex: 0,
          explanation: 'A Circuit Breaker wraps calls to external dependencies; if failures exceed a threshold, it trips to OPEN state, returning fast errors or fallback data to prevent thread exhaustion.'
        },
        {
          question: 'Why are write-ahead append-only logs (WAL / LSM-trees) used in high-throughput data systems like Kafka and Cassandra?',
          options: [
            'Sequential disk writes are orders of magnitude faster than random I/O disk seeks',
            'They eliminate the need for memory RAM entirely',
            'They require no disk storage space',
            'They automatically de-duplicate incoming messages'
          ],
          correctOptionIndex: 0,
          explanation: 'Sequential I/O on disk or SSD is significantly faster than random read/write seeks, allowing append-only logs to sustain hundreds of thousands of operations per second.'
        }
      ]
    });

    // Quiz for Course 4
    const quiz4 = await Quiz.create({
      course: course4._id,
      title: 'Docker & Kubernetes Cloud Engineering Assessment',
      description: 'Test your practical knowledge of multi-stage Docker builds, volumes, and Kubernetes pod orchestration.',
      passingScorePercentage: 75,
      questions: [
        {
          question: 'What is the primary advantage of Multi-Stage Docker builds in production deployments?',
          options: [
            'It allows running multiple containers inside a single image',
            'It separates build dependencies from the final runtime image, resulting in dramatically smaller and more secure images',
            'It enables automatic Kubernetes auto-scaling',
            'It replaces the need for a Docker daemon'
          ],
          correctOptionIndex: 1,
          explanation: 'Multi-stage builds copy only the compiled artifacts and production dependencies into a lightweight base image, reducing image size and attack surface.'
        },
        {
          question: 'What is the difference between a Kubernetes livenessProbe and a readinessProbe?',
          options: [
            'Liveness determines if the container should be restarted; Readiness determines if the container should receive network traffic',
            'Liveness is for databases; Readiness is for web servers',
            'Liveness runs only during cluster initialization; Readiness runs continuously',
            'There is no difference; they are aliases for the same probe'
          ],
          correctOptionIndex: 0,
          explanation: 'If a livenessProbe fails, kubelet kills and restarts the container. If a readinessProbe fails, the pod is removed from Service endpoints so no traffic is routed to it until it recovers.'
        },
        {
          question: 'What is the purpose of Docker volumes compared to container writeable layers?',
          options: [
            'Volumes persist data independently of container lifecycles and bypass the Union File System for higher I/O performance',
            'Volumes compress files to save RAM',
            'Volumes allow containers to run without root privileges',
            'Volumes automatically replicate data to AWS S3'
          ],
          correctOptionIndex: 0,
          explanation: 'Docker volumes exist outside the container Union File System, allowing database state and files to survive container deletion and updates.'
        },
        {
          question: 'In Kubernetes, what resource object manages external HTTP/HTTPS routing to internal Services using path and host rules?',
          options: [
            'ConfigMap',
            'Ingress Controller',
            'DaemonSet',
            'StatefulSet'
          ],
          correctOptionIndex: 1,
          explanation: 'An Ingress exposes HTTP and HTTPS routes from outside the cluster to services within the cluster, handling SSL termination, path-based routing, and virtual hosting.'
        }
      ]
    });

    // 5. Create Enrollments and Certificates
    // Alex Morgan enrolled in Course 1 with 2 lessons completed (50%)
    const enrollmentAlexC1 = await Enrollment.create({
      student: studentAlex._id,
      course: course1._id,
      completedLessons: [c1l1._id, c1l2._id],
      progressPercentage: 50,
      status: 'in-progress',
      quizAttempts: [
        {
          quiz: quiz1._id,
          scorePercentage: 75,
          passed: true,
          attemptedAt: new Date(Date.now() - 3600000 * 24 * 2)
        }
      ]
    });

    // Alex also enrolled in Course 4
    await Enrollment.create({
      student: studentAlex._id,
      course: course4._id,
      completedLessons: [],
      progressPercentage: 0,
      status: 'in-progress'
    });

    // Priya Sharma has completed Course 1 with 100% and has a certificate!
    const enrollmentPriyaC1 = await Enrollment.create({
      student: studentPriya._id,
      course: course1._id,
      completedLessons: [c1l1._id, c1l2._id, c1l3._id, c1l4._id],
      progressPercentage: 100,
      status: 'completed',
      completedAt: new Date(Date.now() - 3600000 * 24 * 5),
      quizAttempts: [
        {
          quiz: quiz1._id,
          scorePercentage: 100,
          passed: true,
          attemptedAt: new Date(Date.now() - 3600000 * 24 * 5)
        }
      ]
    });

    // Issue Priya's Certificate
    const priyaCertId = 'LMS-2026-ARCH9901';
    await Certificate.create({
      certificateId: priyaCertId,
      student: studentPriya._id,
      course: course1._id,
      enrollment: enrollmentPriyaC1._id,
      grade: 'Distinction (100% Quiz Score)',
      issuedAt: new Date(Date.now() - 3600000 * 24 * 5),
      verificationHash: crypto.createHash('sha256').update(priyaCertId + studentPriya._id).digest('hex')
    });

    // 6. Create Reviews
    await Review.create({
      course: course1._id,
      student: studentPriya._id,
      rating: 5,
      comment: 'Exceptional course! The aggregation pipeline breakdowns and compound indexing rules directly helped me ace my technical interview at an enterprise fintech firm.'
    });

    await Review.create({
      course: course1._id,
      student: studentAlex._id,
      rating: 5,
      comment: 'Clear, concise, and production-grade explanation of Mongoose virtuals and data modeling.'
    });

    await Review.create({
      course: course2._id,
      student: studentPriya._id,
      rating: 5,
      comment: 'Great insights into clean layered architecture and JWT security best practices.'
    });

    // Run review aggregation to update courses' rating stats
    await Review.calculateAverageRating(course1._id);
    await Review.calculateAverageRating(course2._id);

    if (!silent) {
      console.log('✅ [Seed Completed Successfully]:');
      console.log(`- 5 Users created (Instructors: Sarah, David | Students: Alex, Priya | Admin)`);
      console.log(`- 4 Courses created across Web Dev, MongoDB, System Design & Cloud`);
      console.log(`- 8 Lessons with rich content & video embeds`);
      console.log(`- 1 Comprehensive Assessment Quiz with 4 questions`);
      console.log(`- 3 Active enrollments with progress tracking`);
      console.log(`- 1 Official Verifiable Certificate issued (ID: ${priyaCertId})`);
      console.log(`- 3 Reviews with auto-calculated aggregate ratings`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// If executed directly from command line: node src/seeds/seedData.js
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    await seedDatabase({ silent: false });
    await disconnectDB();
    process.exit(0);
  })();
}

module.exports = { seedDatabase };
