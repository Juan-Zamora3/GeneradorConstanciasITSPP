import React from 'react';

export default function CourseCard({ course }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-0 overflow-hidden">
      <div className="relative h-40">
        {course.imageUrl
          ? <img
              src={course.imageUrl}
              alt={course.titulo}
              className="w-full h-full object-cover"
            />
          : <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Sin imagen</span>
            </div>
        }
        <button className="absolute top-2 right-2 p-1 bg-black bg-opacity-40 rounded-full text-white text-xl leading-none">
          ⋮
        </button>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold line-clamp-2">{course.titulo}</h3>
        <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-600"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
