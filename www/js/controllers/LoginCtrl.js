'use strict';

angular.module('urbanet.app.controllers', [])

.controller("LoginCtrl", function($scope, $ionicLoading, $ionicModal, $rootScope,
                                  $timeout, $firebaseAuth, $state, $ionicPopup, $cookieStore) {

  var ref = new Firebase('https://urbanetapp.firebaseio.com/'),
      auth = $firebaseAuth(ref),
      authData = ref.getAuth();

  $ionicModal.fromTemplateUrl('templates/tab-signup.html', function($scope, $ionicModal) {
    $scope.modal = $ionicModal;
  }, {
    id: '1',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal1 = modal;
  });

  $scope.signUpErrorShow = false;
  $scope.signInErrorShow = false;
  $scope.userDisplayInfo = {};

  $scope.openModal = function(index) {
    if(index == 1) {
     $scope.oModal1.show();
    }
  };

  $scope.closeModal = function(index) {
    if(index == 1) {
     $scope.oModal1.hide();
    }
  };

  $scope.createUser = function(user) {
    $ionicLoading.show({
      template: 'Creando cuenta'
    });
    $scope.validationError = false;
    if (user.email.length >= 8 && user.name.length >=6 ) {
      if (user.password === user.confirm ) {
        auth.$createUser({
          name: user.name,
          email: user.email,
          password: user.password,
          confirmPass: user.confirm
        }).then(function (userData) {
          ref.child("users").child(userData.uid).set({
            name: user.name,
            email: user.email,
            displayName: user.name
          });
          $ionicLoading.hide();
          $ionicPopup.show({
            template: 'Cuenta creada exitosamente',
            scope: $scope,
            buttons: [
              {
                text: 'Aceptar',
                type: 'button-positive',
                onTap: function() {
                  $state.transitionTo('tabs.news');
                }
              }
            ]
          });
          $scope.closeModal(1);
        }).catch(function (error) {
            $scope.signUpErrorShow = true;
            $scope.signUpErrorMsg = 'E-mail ya esta registrado ' + error;
            $ionicLoading.hide();
        });
        $ionicLoading.hide();
      }else {
        $ionicLoading.hide();
        $scope.signUpErrorShow = true;
        $scope.signUpErrorMsg = "Error al confirmar contraseña";
      }
    }else if (user.email.length < 8 || user.name.length < 6) {
      $ionicLoading.hide();
      $scope.signUpErrorShow = true;
      if (user.email.length < 8) {
        $scope.signUpErrorMsg = "E-mail debe ser más largo";
      }else {
        $scope.signUpErrorMsg = "Nombre debe ser más largo";
      }
    }else {
      $ionicLoading.hide();
      $scope.signUpErrorShow = true;
      $scope.signUpErrorMsg = "Falta espacio requerido";
    }
  };

  $scope.localStorageInfo = function() {
    $scope.userDisplayInfoName = $cookieStore.get('username');
    $scope.userDisplayInfoEmail = $cookieStore.get('email');
  };
  $scope.localStorageInfo();

  $scope.signIn = function (user) {
    $scope.signInErrorShow = false;
    if (user && user.email && user.pwdForLogin) {
      $ionicLoading.show({
        template: 'Ingresando...<br>'+
                  '<ion-spinner class="spinner-energized"'+
                  'icon="android"></ion-spinner>',
        duration: 1000
      });
      auth.$authWithPassword({
        email: user.email,
        password: user.pwdForLogin
      }).then(function (authData) {
        ref.child("users").child(authData.uid).once('value', function (snapshot) {
          var val = snapshot.val();
          $scope.$apply(function () {
            $rootScope.name = val;
            $scope.userDisplayInfoName = $rootScope.name.displayName;
            $scope.userDisplayInfoEmail = $rootScope.name.email;
            $cookieStore.put('username', $rootScope.name.displayName);
            $cookieStore.put('email', $rootScope.name.email);
          });
        });
        $scope.userLogin = true;
        $ionicLoading.hide();
        $scope.closeModal(1);
        $scope.showSignButtons = true;
      }).catch(function (error) {
        $scope.signInErrorMsg = error.message;
        $scope.signInErrorShow = true;
        $ionicLoading.hide();
      });
    } else
    $scope.signInErrorShow = true;
    $scope.signInErrorMsg = 'E-mail y Contraseña son requeridos';
  };

  // Register the callback to be fired every time auth state changes
  function authDataCallback(authData) {
    $scope.authData = authData;
    console.log($scope.authData);
    if (authData) {
      console.log("User " + authData.uid + " is logged in with " + authData.provider);
    } else {
      console.log("User is logged out");
    }
  };
  ref.onAuth(authDataCallback);

  $scope.logOut = function() {
    $ionicLoading.show({
      template: 'Cerrando sesión...<br>'+
                '<ion-spinner class="spinner-energized"'+
                'icon="android"></ion-spinner>',
      duration: 1000
    });
    ref.unauth()
    $cookieStore.remove('username');
    $cookieStore.remove('email');
    $state.transitionTo('tabs.news');
  };
});
