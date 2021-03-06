const graphql = require("graphql");
const bcrypt = require("bcrypt");

const Course = require("../models/course");
const Professor = require("../models/professor");
const User = require("../models/user");
const auth = require("../utils/auth");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLID,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
} = graphql;

const CourseType = new GraphQLObjectType({
  name: "Course",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    language: { type: GraphQLString },
    date: { type: GraphQLString },
    professor: {
      type: ProfessorType,
      resolve(parent, args) {
        // return professors.find(
        //   (professor) => professor.id === parent.profesorId
        // );

        return Professor.findById(parent.professorId);
      },
    },
  }),
});

const ProfessorType = new GraphQLObjectType({
  name: "Professor",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    age: { type: GraphQLInt },
    active: { type: GraphQLBoolean },
    date: { type: GraphQLString },
    course: {
      type: new GraphQLList(CourseType),
      resolve(parent, args) {
        // return courses.filter((course) => course.profesorId == parent.id);
        console.log(parent.id);
        Course.find({ professorId: parent.id });
      },
    },
  }),
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    date: { type: GraphQLString },
  }),
});

const MessageType = new GraphQLObjectType({
  name: "Message",
  fields: () => ({
    message: { type: GraphQLString },
    token: { type: GraphQLString },
    error: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    course: {
      type: CourseType,
      args: {
        id: { type: GraphQLID },
      },
      resolve(parent, args, context) {
        // return courses.find((curso) => curso.id == args.id);
        if (context.user.auth) {
          return Course.findById(args.id);
        }
        throw new Error("Unauthenticated...");
      },
    },
    courses: {
      type: new GraphQLList(CourseType),
      resolve(parent, args) {
        // return courses;
        return Course.find();
      },
    },
    professor: {
      type: ProfessorType,
      args: {
        name: { type: GraphQLString },
      },
      resolve(parent, args) {
        // return professors.find((professor) => professor.name == args.name);
        return Professor.findOne({ name: args.name });
      },
    },
    professors: {
      type: new GraphQLList(ProfessorType),
      resolve(parent, args) {
        // return professors;
        return Professor.find();
      },
    },
    user: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
      },
      resolve(parent, args) {
        return users.find((user) => user.email == args.email);
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addCourse: {
      type: CourseType,
      args: {
        name: { type: GraphQLString },
        language: { type: GraphQLString },
        date: { type: GraphQLString },
        professorId: { type: GraphQLString },
      },
      resolve(parent, args) {
        let course = new Course({
          name: args.name,
          language: args.language,
          date: args.date,
          professorId: args.professorId,
        });

        return course.save();
      },
    },
    updateCourse: {
      type: CourseType,
      args: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        language: { type: GraphQLString },
        date: { type: GraphQLString },
        professorId: { type: GraphQLString },
      },
      resolve(parent, args) {
        return Course.findByIdAndUpdate(
          args.id,
          {
            name: args.name,
            language: args.language,
            date: args.date,
            professorId: args.professorId,
          },
          { new: true }
        );
      },
    },
    deleteCourse: {
      type: CourseType,
      args: {
        id: { type: GraphQLID },
      },
      resolve(parent, args) {
        return Course.findByIdAndDelete(args.id);
      },
    },
    deleteAllCourses: {
      type: CourseType,
      resolve(parent, args) {
        return Course.deleteMany({});
      },
    },
    addProfessor: {
      type: ProfessorType,
      args: {
        name: { type: GraphQLString },
        age: { type: GraphQLInt },
        active: { type: GraphQLBoolean },
        date: { type: GraphQLString },
      },
      resolve(parent, args) {
        return Professor(args).save();
      },
    },
    updateProfessor: {
      type: ProfessorType,
      args: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        age: { type: GraphQLInt },
        active: { type: GraphQLBoolean },
        date: { type: GraphQLString },
      },
      resolve(parent, args) {
        return Professor.findByIdAndUpdate(
          args.id,
          {
            name: args.name,
            age: args.age,
            active: args.active,
            date: args.date,
          },
          { new: true }
        );
      },
    },
    deleteProfessor: {
      type: ProfessorType,
      args: {
        id: { type: GraphQLID },
      },
      resolve(parent, args) {
        return Professor.findByIdAndDelete(args.id);
      },
    },
    addUser: {
      type: MessageType,
      args: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        date: { type: GraphQLString },
      },
      async resolve(parent, args) {
        let user = await User.findOne({ email: args.email });
        if (user) return { error: "Usuario ya esta en la base de datos" };

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(args.password, salt);

        user = new User({
          name: args.name,
          email: args.email,
          date: args.date,
          password: hashPassword,
        });

        user.save();

        return { message: "Usuario registrado correctamente." };
      },
    },

    login: {
      type: MessageType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parent, args) {
        const result = await auth.login(args.email, args.password, "1234");
        return {
          message: result.message,
          error: result.error,
          token: result.token,
        };
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
