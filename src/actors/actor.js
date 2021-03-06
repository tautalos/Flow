var Rx          = require('../lib.imports').Rx;
var _           = require('../lib.imports').lodash;
var Immutable   = require('../lib.imports' ).Immutable;
var Subject     = require('../stages/subject');
var Action      = require('../actions/action');

var Actor, Private;

Actor = function( name, stage, actions ){
    Subject.call( this );
    var Actor = this;
    var _private = {};
    var _arguments = arguments;

    Actor.name      = '';
    Actor.finalized = false;
    Actor.stage     = null;
    Actor.actions   = null;

    _private.actionsArray;

    _private.init = function () {
        _private.checkConstructorArguments();
        _private.initName();
        _private.initStage();
        _private.initActions();
        _private.registerActions();
        _private.createSubscription();
        _private.finalize();
    };
    _private.checkConstructorArguments = function (){
        if( _arguments.length < 3 ){
            throw Actor.ERRORS.ACTOR_CANNOT_BE_INSTANTIATED_WITHOUT_ALL_REQUIRED_PARAMETERS;
        }
    };
    _private.initName = function(){
        Actor.name =  _.isString( name ) && name !== '' ? Private.buildActorName( name ) : Private.anonymousName;
    };
    _private.initStage = function(){
        if( stage instanceof Subject && 'addActorAction' in stage ){
            Actor.stage = stage;
        } else {
            throw Actor.ERRORS.ACTOR_CANNOT_BE_INSTANTIATED_WITHOUT_A_VALID_STAGE;
        }
    };
    _private.initActions = function (){
        if( _.isArray( actions )){
            _.forEach( actions, function( action ){
                if( action instanceof Action === false ){
                    throw Actor.ERRORS.ACTOR_CANNOT_BE_INSTANTIATED_WITH_A_COLLECTION_WITH_NON_ACTIONS;
                }
            });
            Actor.actions = new Immutable.Set( actions );
        } else {
            throw Actor.ERRORS.INCORRECT_CONSTRUCTOR_PARAMETER_AN_ARRAY_OF_ACTION_IS_REQUIRED;
        }
    };
    _private.registerActions = function (){
        Actor.actions.forEach( function( action ){
            if( stage.hasAction( action ) === false ){
                stage.addActorAction( Actor, action );
            } else {
                Actor.ERRORS.ACTOR_CANNOT_BE_INSTANTIATED_WITH_ACTION_ALREADY_ON_STAGE;
            }
        });
    };
    _private.createSubscription = function (){
        Actor.stageObserver = Actor.stage.filter(function( signal ){
            return  Actor.actions.has( signal.action );
        }).subscribe( Actor );
    };

    _private.finalize = function (){
       Object.freeze( Actor );
    };

    _private.init();
};

Actor.prototype = _.create( Subject.prototype, {
    constructor: Actor,
    ACTOR_POSTFIX: '_ACTOR',
    ANOMYMOUS_ACTOR_NAME: 'ANONYMOUS' + '_ACTOR',
    ERRORS: {
        ACTOR_CANNOT_BE_INSTANTIATED_WITHOUT_ALL_REQUIRED_PARAMETERS:
            new Error('an Actor requires a Name, Stage, and an Actions Collection at construction'),
        ACTOR_CANNOT_BE_INSTANTIATED_WITHOUT_A_VALID_STAGE:
            new Error('Actor can not be instantiated without a valid stage'),
        ACTOR_CANNOT_BE_INSTANTIATED_WITH_ACTION_ALREADY_ON_STAGE:
            new Error('Actor can not be instantiated with a action already on the stage'),
        INCORRECT_CONSTRUCTOR_PARAMETER_AN_ARRAY_OF_ACTION_IS_REQUIRED:
            new Error('Actor needs an Array<Actions> at instantiation'),
        ACTOR_CANNOT_BE_INSTANTIATED_WITH_A_COLLECTION_WITH_NON_ACTIONS:
            new Error('Actor cannot instantiated with a mixed collection, in the collection they must all be actions')
    },
    isFinalized: function(){
        return this.finalized || false;
    },
    isEmptyActor: function(){
        return this === this.EmptyActor;
    }
});

Private = {
    anonymousName: Actor.prototype.ANOMYMOUS_ACTOR_NAME,
    buildActorName  : function( nameString ) {
        return nameString.toUpperCase().replace(/[\s*]/, '_') + Actor.prototype.ACTOR_POSTFIX;
    }
};
var emptySubject = new Subject();
emptySubject.addActorAction = Rx.noop;
Actor.prototype.EmptyActor = new Actor(
    'EMPTY',
    emptySubject,
    []
);
Object.freeze( Actor.prototype.EmptyActor );
Object.freeze( Actor.prototype );

module.exports = Actor;