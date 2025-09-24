import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MdSchool, MdLocationOn, MdPhone, MdEmail, MdWeb } from "react-icons/md"
import itsppLogo from '../assets/logo.png'

export default function PantallaCajero() {
  const navigate = useNavigate()

  const handleNavigateToCourses = () => {
    navigate('/cursos-cajero')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50">
      {/* Header institucional */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-6">
            <img src={itsppLogo} alt="ITSPP Logo" className="w-16 h-16" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Instituto Tecnológico Superior de Puerto Peñasco
              </h1>
              <p className="text-lg text-blue-700 font-medium mt-1">
                Sistema de Gestión de Constancias - Terminal Cajero
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Bienvenida */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido al Sistema de Constancias!
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Terminal especializado para la generación e impresión de constancias de participación en concursos y eventos académicos
          </p>
        </div>

        {/* Tarjeta principal de acceso */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-green-600 px-8 py-8">
              <div className="text-center text-white">
                <MdSchool className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Panel de Control</h3>
                <p className="text-blue-100">Accede a la gestión de cursos y generación de constancias</p>
              </div>
            </div>
            
            <div className="p-8 text-center">
              <button
                onClick={handleNavigateToCourses}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold py-6 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  <MdSchool className="w-8 h-8" />
                  <span>Acceder a Cursos Activos</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Información institucional */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Información de contacto */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MdLocationOn className="w-6 h-6 text-blue-600 mr-3" />
              Información de Contacto
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MdLocationOn className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Dirección</p>
                  <p className="text-gray-600">Puerto Peñasco, Sonora, México</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MdWeb className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Sitio Web</p>
                  <p className="text-blue-600">www.puertopenasco.tecnm.mx</p>
                </div>
              </div>
            </div>
          </div>

          {/* Misión y visión */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Nuestra Misión
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Formar profesionistas competentes e innovadores con sentido ético y compromiso social, 
              a través de programas educativos de calidad que contribuyan al desarrollo sustentable 
              de la región y del país.
            </p>
          </div>
        </div>

        {/* Servicios disponibles */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Servicios del Terminal
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSchool className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-blue-800 mb-2">Gestión de Cursos</h4>
              <p className="text-blue-700 text-sm">Visualización y administración de cursos activos y equipos participantes</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-green-800 mb-2">Constancias</h4>
              <p className="text-green-700 text-sm">Generación automática e impresión de constancias de participación</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-purple-800 mb-2">Sistema de Pago</h4>
              <p className="text-purple-700 text-sm">Procesamiento seguro de pagos para servicios de constancias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}